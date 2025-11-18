// backend/models/client.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

// DynamoDB Table
const CLIENTS_TABLE = process.env.CLIENTS_TABLE || "Clients";

// DynamoDB Client
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient());

// ------------------------------
// VALIDATION
// ------------------------------
function validateClient(data) {
  if (!data.name) return "Client name is required";
  return null;
}

// ------------------------------
// CREATE FORMATTER
// ------------------------------
function createClient(data) {
  const timestamp = Date.now();

  return {
    id: uuidv4(),
    name: data.name,
    logo: data.logo || "",
    website: data.website || "",
    description: data.description || "",
    isActive: data.isActive ?? true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// ------------------------------
// UPDATE FORMATTER
// ------------------------------
function updateClient(existing, updates) {
  return {
    ...existing,
    ...updates,
    updatedAt: Date.now()
  };
}

// ------------------------------
// CRUD FUNCTIONS
// ------------------------------

// GET ALL CLIENTS
async function getAllClients() {
  const result = await docClient.send(
    new ScanCommand({ TableName: CLIENTS_TABLE })
  );

  return result.Items || [];
}

// GET SINGLE CLIENT
async function getClientById(id) {
  const result = await docClient.send(
    new GetCommand({
      TableName: CLIENTS_TABLE,
      Key: { id },
    })
  );

  return result.Item;
}

// CREATE CLIENT
async function createClientRecord(data) {
  const error = validateClient(data);
  if (error) throw new Error(error);

  const item = createClient(data);

  await docClient.send(
    new PutCommand({
      TableName: CLIENTS_TABLE,
      Item: item,
    })
  );

  return item;
}

// UPDATE CLIENT
async function updateClientRecord(id, updates) {
  const existing = await getClientById(id);
  if (!existing) throw new Error("Client not found");

  const updated = updateClient(existing, updates);

  await docClient.send(
    new PutCommand({
      TableName: CLIENTS_TABLE,
      Item: updated,
    })
  );

  return updated;
}

// DELETE CLIENT
async function deleteClientRecord(id) {
  const existing = await getClientById(id);
  if (!existing) throw new Error("Client not found");

  await docClient.send(
    new DeleteCommand({
      TableName: CLIENTS_TABLE,
      Key: { id },
    })
  );

  return { message: "Client deleted successfully" };
}

// ------------------------------
// EXPORTS
// ------------------------------
module.exports = {
  CLIENTS_TABLE,
  getAllClients,
  getClientById,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord
};
