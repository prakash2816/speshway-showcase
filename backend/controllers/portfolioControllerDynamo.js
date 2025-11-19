const { v4: uuidv4 } = require("uuid");
const { cloudinary } = require("../config/cloudinaryDynamo");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = "Portfolios";

// ============================================================================
// GET ALL PORTFOLIOS
// ============================================================================
const getPortfolios = async (req, res) => {
  try {
    const result = await ddb.send(
      new ScanCommand({
        TableName: TABLE_NAME
      })
    );

    // Sort newest first (Dynamo doesn't sort)
    const portfolios = result.Items.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================================
// GET SINGLE PORTFOLIO
// ============================================================================
const getPortfolio = async (req, res) => {
  try {
    const result = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: req.params.id }
      })
    );

    if (!result.Item) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.json(result.Item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================================
// CREATE PORTFOLIO
// ============================================================================
const createPortfolio = async (req, res) => {
  try {
    const id = uuidv4();

    const portfolioData = {
      id,
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      technologies:
        typeof req.body.technologies === "string"
          ? JSON.parse(req.body.technologies)
          : req.body.technologies,
      color: req.body.color || "from-blue-500/20 to-cyan-500/20",
      image: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If image uploaded
    if (req.file) {
      portfolioData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: portfolioData
      })
    );

    res.status(201).json(portfolioData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ============================================================================
// UPDATE PORTFOLIO
// ============================================================================
const updatePortfolio = async (req, res) => {
  try {
    // Get existing portfolio
    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: req.params.id }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    const portfolio = existing.Item;

    // Delete old image if new uploaded
    if (req.file && portfolio.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(portfolio.image.publicId);
      } catch (err) {
        console.error("Cloudinary delete error:", err);
      }
    }

    // Build updated fields
    const updatedData = {
      title: req.body.title || portfolio.title,
      category: req.body.category || portfolio.category,
      description: req.body.description || portfolio.description,
      technologies: req.body.technologies
        ? typeof req.body.technologies === "string"
          ? JSON.parse(req.body.technologies)
          : req.body.technologies
        : portfolio.technologies,
      color: req.body.color || portfolio.color,
      image: req.file
        ? {
            url: req.file.path,
            publicId: req.file.filename
          }
        : portfolio.image,
      updatedAt: new Date().toISOString()
    };

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: req.params.id },
        UpdateExpression:
          "SET title = :t, category = :c, description = :d, technologies = :tech, color = :col, image = :img, updatedAt = :u",
        ExpressionAttributeValues: {
          ":t": updatedData.title,
          ":c": updatedData.category,
          ":d": updatedData.description,
          ":tech": updatedData.technologies,
          ":col": updatedData.color,
          ":img": updatedData.image,
          ":u": updatedData.updatedAt
        }
      })
    );

    res.json({ id: req.params.id, ...updatedData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ============================================================================
// DELETE PORTFOLIO
// ============================================================================
const deletePortfolio = async (req, res) => {
  try {
    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: req.params.id }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // Delete image from Cloudinary
    if (existing.Item.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(existing.Item.image.publicId);
      } catch (err) {
        console.error("Image delete error:", err);
      }
    }

    // Delete item from table
    await ddb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id: req.params.id }
      })
    );

    res.json({ message: "Portfolio removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio
};
