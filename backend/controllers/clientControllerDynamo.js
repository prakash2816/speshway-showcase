const { v4: uuidv4 } = require("uuid");
const {
  DynamoDBClient
} = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

// Create DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "Clients";

// -------------------------------
// GET ALL CLIENTS
// -------------------------------
const getClients = async (req, res) => {
  try {
    const isAdmin =
      req.user && (req.user.role === "admin" || req.user.role === "hr");

    const showAll = req.query.all === "true" && isAdmin;

    const params = {
      TableName: TABLE_NAME
    };

    const result = await docClient.send(new ScanCommand(params));

    let clients = result.Items || [];

    if (!showAll) {
      clients = clients.filter((c) => c.isActive === true);
    }

    // (Optional) Sort by creation date
    clients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------------------
// GET SINGLE CLIENT
// -------------------------------
const getClient = async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: req.params.id }
    };

    const result = await docClient.send(new GetCommand(params));

    if (!result.Item) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(result.Item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------------------
// CREATE CLIENT
// -------------------------------
const createClient = async (req, res) => {
  try {
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ message: "Client name is required" });
    }

    const newClient = {
      id: uuidv4(),
      name: req.body.name.trim(),
      logo: req.body.logo?.trim() || "",
      website: req.body.website?.trim() || "",
      description: req.body.description?.trim() || "",
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      createdAt: new Date().toISOString()
    };

    const params = {
      TableName: TABLE_NAME,
      Item: newClient
    };

    await docClient.send(new PutCommand(params));

    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------------------
// UPDATE CLIENT
// -------------------------------
const updateClient = async (req, res) => {
  try {
    const existing = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { id: req.params.id } })
    );

    if (!existing.Item) {
      return res.status(404).json({ message: "Client not found" });
    }

    const updateData = {
      name: req.body.name?.trim() ?? existing.Item.name,
      logo: req.body.logo?.trim() ?? existing.Item.logo,
      website: req.body.website?.trim() ?? existing.Item.website,
      description: req.body.description?.trim() ?? existing.Item.description,
      isActive:
        req.body.isActive !== undefined
          ? req.body.isActive
          : existing.Item.isActive,
      updatedAt: new Date().toISOString()
    };

    const params = {
      TableName: TABLE_NAME,
      Key: { id: req.params.id },
      UpdateExpression:
        "set #name = :name, logo = :logo, website = :website, description = :description, isActive = :isActive, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#name": "name"
      },
      ExpressionAttributeValues: updateData,
      ReturnValues: "ALL_NEW"
    };

    const result = await docClient.send(new UpdateCommand(params));

    res.json(result.Attributes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------------------
// DELETE CLIENT
// -------------------------------
const deleteClient = async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: req.params.id }
    };

    await docClient.send(new DeleteCommand(params));

    res.json({ message: "Client removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
};
