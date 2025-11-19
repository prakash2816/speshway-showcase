// galleryController.js (DynamoDB + S3 + Multer)
require("dotenv").config();
const {
  DynamoDBClient
} = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const path = require("path");
const { v4: uuid } = require("uuid");

// AWS Clients
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.AWS_S3_BUCKET;

// DynamoDB table
const TABLE = "GalleryTable";

// Multer for S3 uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase());
    if (!allowed) return cb(new Error("Only image files allowed"));
    cb(null, true);
  }
});

// -----------------------------------------
//  GET ALL GALLERY ITEMS
// -----------------------------------------
const getGalleryItems = async (req, res) => {
  try {
    const { category, limit = 12, page = 1, sort = "DESC" } = req.query;

    const params = { TableName: TABLE };
    const result = await ddb.send(new ScanCommand(params));

    let items = result.Items || [];

    // filter active only
    items = items.filter(i => i.isActive && i.title !== "Category Placeholder");

    if (category && category !== "all") {
      items = items.filter(i => i.category === category);
    }

    // sorting
    items.sort((a, b) => sort === "ASC" ? a.date - b.date : b.date - a.date);

    // pagination
    const start = (page - 1) * limit;
    const paginated = items.slice(start, start + parseInt(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(items.length / limit),
        totalItems: items.length,
        itemsPerPage: Number(limit),
        hasNext: start + Number(limit) < items.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Gallery list error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
//  GET SINGLE ITEM
// -----------------------------------------
const getGalleryItem = async (req, res) => {
  try {
    const { Item } = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { id: req.params.id }
      })
    );

    if (!Item) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: Item });
  } catch (error) {
    console.error("Get single error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
//  CREATE NEW GALLERY
// -----------------------------------------
const createGalleryItem = async (req, res) => {
  try {
    const { title, description, category, date, location, readMoreLink } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!req.file) return res.status(400).json({ success: false, message: "Image required" });

    // upload file to S3
    const key = `gallery/${Date.now()}-${req.file.originalname}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      })
    );

    const id = uuid();
    const item = {
      id,
      title,
      description,
      category,
      date: date ? Number(new Date(date)) : Date.now(),
      location: location || "",
      readMoreLink: readMoreLink || "",
      image: {
        url: `https://${BUCKET}.s3.amazonaws.com/${key}`,
        key
      },
      createdBy: req.user?.id || "admin",
      isActive: true,
      createdAt: Date.now()
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error("Create gallery error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
//  UPDATE GALLERY
// -----------------------------------------
const updateGalleryItem = async (req, res) => {
  try {
    const { title, description, category, date, location, readMoreLink, isActive } = req.body;

    const { Item: oldItem } = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { id: req.params.id }
      })
    );

    if (!oldItem) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    let newImage = oldItem.image;

    // uploading new image
    if (req.file) {
      const key = `gallery/${Date.now()}-${req.file.originalname}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype
        })
      );
      newImage = { url: `https://${BUCKET}.s3.amazonaws.com/${key}`, key };

      // Delete old file
      if (oldItem.image?.key) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: oldItem.image.key
          })
        );
      }
    }

    const updates = {
      ...oldItem,
      title: title || oldItem.title,
      description: description || oldItem.description,
      category: category || oldItem.category,
      location: location !== undefined ? location : oldItem.location,
      readMoreLink: readMoreLink !== undefined ? readMoreLink : oldItem.readMoreLink,
      date: date ? Number(new Date(date)) : oldItem.date,
      isActive: isActive !== undefined ? isActive : oldItem.isActive,
      image: newImage
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: updates
      })
    );

    res.json({ success: true, data: updates });
  } catch (error) {
    console.error("Update gallery error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
//  DELETE GALLERY
// -----------------------------------------
const deleteGalleryItem = async (req, res) => {
  try {
    const { Item } = await ddb.send(
      new GetCommand({ TableName: TABLE, Key: { id: req.params.id } })
    );

    if (!Item) return res.status(404).json({ success: false, message: "Not found" });

    // delete image from s3
    if (Item.image?.key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: Item.image.key
        })
      );
    }

    await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { id: req.params.id } }));

    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
//  GALLERY STATISTICS
// -----------------------------------------
const getGalleryStats = async (req, res) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE }));
    const items = result.Items || [];

    const totalItems = items.length;
    const activeItems = items.filter(i => i.isActive).length;

    const categoryStats = {};
    items.forEach(i => {
      if (!categoryStats[i.category]) categoryStats[i.category] = 0;
      categoryStats[i.category]++;
    });

    const formattedStats = Object.keys(categoryStats).map(cat => ({
      category: cat,
      count: categoryStats[cat]
    }));

    res.json({
      success: true,
      data: {
        totalItems,
        activeItems,
        categoryStats: formattedStats
      }
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
//  GET UNIQUE CATEGORIES
// -----------------------------------------
const getCategories = async (req, res) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE }));
    const items = result.Items || [];

    const categories = [...new Set(items.map(i => i.category))];

    const defaultCategories = ["Fests", "Awards", "Fun Activities", "Team Moments"];

    const all = [...new Set([...categories, ...defaultCategories])].sort();

    res.json({ success: true, data: all });
  } catch (error) {
    console.error("Category error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
//  CREATE CATEGORY (PLACEHOLDER ITEM)
// -----------------------------------------
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name required" });
    }

    const trimmed = name.trim();

    const id = uuid();

    const placeholder = {
      id,
      title: "Category Placeholder",
      description: "Auto created category placeholder",
      category: trimmed,
      image: { url: "placeholder", key: "placeholder" },
      isActive: false,
      createdAt: Date.now()
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: placeholder }));

    res.json({ success: true, message: "Category created", data: trimmed });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------------------
//  DELETE CATEGORY
// -----------------------------------------
const deleteCategory = async (req, res) => {
  try {
    const category = req.params.name;

    const result = await ddb.send(new ScanCommand({ TableName: TABLE }));
    const items = result.Items || [];

    const active = items.filter(
      i => i.category === category && i.isActive && i.title !== "Category Placeholder"
    ).length;

    if (active > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete. ${active} items using this category.`
      });
    }

    const placeholders = items.filter(
      i => i.category === category && i.title === "Category Placeholder"
    );

    for (const p of placeholders) {
      await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { id: p.id } }));
    }

    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  upload,
  getGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getGalleryStats,
  getCategories,
  createCategory,
  deleteCategory
};
