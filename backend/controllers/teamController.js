const { v4: uuidv4 } = require("uuid");
const { cloudinary } = require("../config/cloudinaryDynamo");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

// DynamoDB Client
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "Team"; // Fixed table name

// ======================================
// GET ALL TEAM MEMBERS
// ======================================
const getTeamMembers = async (req, res) => {
  try {
    const data = await dynamo.send(new ScanCommand({ TableName: TABLE_NAME }));
    const sorted = (data.Items || []).sort((a, b) => b.createdAt - a.createdAt);
    res.json(sorted);
  } catch (error) {
    console.error("Get team members error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ======================================
// GET SINGLE TEAM MEMBER
// ======================================
const getTeamMember = async (req, res) => {
  try {
    const data = await dynamo.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { id: req.params.id } })
    );

    if (!data.Item) {
      return res.status(404).json({ message: "Team member not found" });
    }

    res.json(data.Item);
  } catch (error) {
    console.error("Get team member error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ======================================
// CREATE TEAM MEMBER
// ======================================
const createTeamMember = async (req, res) => {
  try {
    if (!req.body.name || !req.body.role) {
      return res.status(400).json({ message: "Name and role are required" });
    }

    const id = uuidv4();
    const timestamp = Date.now();

    const memberData = {
      id,
      ...req.body,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // IMAGE UPLOAD
    if (req.file) {
      memberData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: memberData }));

    res.status(201).json(memberData);
  } catch (error) {
    console.error("Create team member error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ======================================
// UPDATE TEAM MEMBER
// ======================================
const updateTeamMember = async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await dynamo.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { id } })
    );

    if (!existing.Item) {
      return res.status(404).json({ message: "Team member not found" });
    }

    const updatedMember = {
      ...existing.Item,
      ...req.body,
      updatedAt: Date.now()
    };

    // Handle new image upload
    if (req.file) {
      if (existing.Item.image?.publicId) {
        try {
          await cloudinary.uploader.destroy(existing.Item.image.publicId);
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }

      updatedMember.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: updatedMember }));

    res.json(updatedMember);
  } catch (error) {
    console.error("Update team member error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ======================================
// DELETE TEAM MEMBER
// ======================================
const deleteTeamMember = async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await dynamo.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { id } })
    );

    if (!existing.Item) {
      return res.status(404).json({ message: "Team member not found" });
    }

    // Delete image from Cloudinary if exists
    if (existing.Item.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(existing.Item.image.publicId);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }

    await dynamo.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));

    res.json({ message: "Team member removed" });
  } catch (error) {
    console.error("Delete team member error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
};
