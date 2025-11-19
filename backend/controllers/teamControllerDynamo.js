const { v4: uuidv4 } = require("uuid");
const { cloudinary } = require("../config/cloudinaryDynamo");

// AWS SDK v3
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TEAM_TABLE;

// ======================================
// GET ALL TEAM MEMBERS (SCAN)
// ======================================
const getTeamMembers = async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME
    };

    const data = await dynamo.send(new ScanCommand(params));

    const sorted = data.Items.sort((a, b) => b.createdAt - a.createdAt);

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================
// GET SINGLE TEAM MEMBER
// ======================================
const getTeamMember = async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: req.params.id }
    };

    const data = await dynamo.send(new GetCommand(params));

    if (!data.Item)
      return res.status(404).json({ message: "Team member not found" });

    res.json(data.Item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================
// CREATE TEAM MEMBER
// ======================================
const createTeamMember = async (req, res) => {
  try {
    const id = uuidv4();

    const memberData = {
      id,
      ...req.body,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // IMAGE UPLOAD
    if (req.file) {
      memberData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const params = {
      TableName: TABLE_NAME,
      Item: memberData
    };

    await dynamo.send(new PutCommand(params));

    res.status(201).json(memberData);
  } catch (error) {
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

    if (!existing.Item)
      return res.status(404).json({ message: "Team member not found" });

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

    const params = {
      TableName: TABLE_NAME,
      Item: updatedMember
    };

    await dynamo.send(new PutCommand(params));

    res.json(updatedMember);
  } catch (error) {
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

    if (!existing.Item)
      return res.status(404).json({ message: "Team member not found" });

    // Delete image from Cloudinary
    if (existing.Item.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(existing.Item.image.publicId);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }

    await dynamo.send(
      new DeleteCommand({ TableName: TABLE_NAME, Key: { id } })
    );

    res.json({ message: "Team member removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
};
