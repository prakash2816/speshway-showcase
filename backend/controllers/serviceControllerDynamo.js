const { v4: uuidv4 } = require("uuid");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

// DynamoDB Client
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);

const TABLE = "Services";

// ============================================================================
// GET ALL SERVICES
// ============================================================================
const getServicesDynamo = async (req, res) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE }));

    const services = result.Items.sort((a, b) => b.createdAt - a.createdAt);

    res.json(services);
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================================
// GET SINGLE SERVICE
// ============================================================================
const getService = async (req, res) => {
  try {
    const result = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { id: req.params.id }
      })
    );

    if (!result.Item) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(result.Item);
  } catch (error) {
    console.error("Get service error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================================
// CREATE SERVICE
// ============================================================================
const createService = async (req, res) => {
  try {
    const id = uuidv4();

    const newService = {
      id,
      ...req.body,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: newService
      })
    );

    res.status(201).json(newService);
  } catch (error) {
    console.error("Create service error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ============================================================================
// UPDATE SERVICE
// ============================================================================
const updateService = async (req, res) => {
  try {
    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { id: req.params.id }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({ message: "Service not found" });
    }

    const updated = {
      ...existing.Item,
      ...req.body,
      updatedAt: Date.now()
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: updated
      })
    );

    res.json(updated);
  } catch (error) {
    console.error("Update service error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ============================================================================
// DELETE SERVICE
// ============================================================================
const deleteService = async (req, res) => {
  try {
    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { id: req.params.id }
      })
    );

    if (!existing.Item) {
      return res.status(404).json({ message: "Service not found" });
    }

    await ddb.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { id: req.params.id }
      })
    );

    res.json({ message: "Service removed" });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getServicesDynamo,
  getService,
  createService,
  updateService,
  deleteService
};
