const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const { cloudinary } = require("../config/cloudinary");

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TEAM_TABLE;

// ============== GET ALL TEAM MEMBERS (SCAN) ==============
const getTeamMembers = async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };

    const data = await dynamo.scan(params).promise();

    // Sort by createdAt desc
    const sorted = data.Items.sort((a, b) => b.createdAt - a.createdAt);

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== GET SINGLE TEAM MEMBER ==============
const getTeamMember = async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: req.params.id },
    };

    const data = await dynamo.get(params).promise();

    if (!data.Item) return res.status(404).json({ message: "Team member not found" });

    res.json(data.Item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== CREATE TEAM MEMBER ==============
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
        publicId: req.file.filename,
      };
    }

    const params = {
      TableName: TABLE_NAME,
      Item: memberData,
    };

    await dynamo.put(params).promise();

    res.status(201).json(memberData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ============== UPDATE TEAM MEMBER ==============
const updateTeamMember = async (req, res) => {
  try {
    const id = req.params.id;

    // Fetch existing item
    const existing = await dynamo
      .get({ TableName: TABLE_NAME, Key: { id } })
      .promise();

    if (!existing.Item) return res.status(404).json({ message: "Team member not found" });

    const updatedMember = {
      ...existing.Item,
      ...req.body,
      updatedAt: Date.now(),
    };

    // Handle new image
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
        publicId: req.file.filename,
      };
    }

    const params = {
      TableName: TABLE_NAME,
      Item: updatedMember,
    };

    await dynamo.put(params).promise();

    res.json(updatedMember);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ============== DELETE TEAM MEMBER ==============
const deleteTeamMember = async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await dynamo
      .get({ TableName: TABLE_NAME, Key: { id } })
      .promise();

    if (!existing.Item) return res.status(404).json({ message: "Team member not found" });

    // Delete image
    if (existing.Item.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(existing.Item.image.publicId);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }

    const params = {
      TableName: TABLE_NAME,
      Key: { id },
    };

    await dynamo.delete(params).promise();

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
