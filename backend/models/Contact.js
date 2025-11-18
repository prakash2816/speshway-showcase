// backend/modules/contactDynamo.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

// DynamoDB Table
const CONTACTS_TABLE = process.env.CONTACTS_TABLE || "Contacts";

// DynamoDB Client
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient());

// ------------------------------
// VALIDATION
// ------------------------------
function validateContact(data) {
  if (!data.name) return "Name is required";
  if (!data.email) return "Email is required";
  if (!data.subject) return "Subject is required";
  if (!data.message) return "Message is required";

  return null;
}

// ------------------------------
// CREATE FORMATTER
// ------------------------------
function formatNewContact(data, fileData) {
  const timestamp = Date.now();

  return {
    id: uuidv4(),
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone || "",
    subject: data.subject,
    message: data.message,

    resume: fileData
      ? {
          filename: fileData.filename,
          originalName: fileData.originalName,
          mimetype: fileData.mimetype,
          size: fileData.size,
          path: fileData.path,
          url: fileData.url,
        }
      : null,

    type: data.type || "contact", // contact | resume | message
    status: "new",

    replies: [],

    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

// ------------------------------
// UPDATE FORMATTER
// ------------------------------
function formatUpdatedContact(existing, updates, fileData) {
  const updated = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  // If new resume uploaded
  if (fileData) {
    updated.resume = {
      filename: fileData.filename,
      originalName: fileData.originalName,
      mimetype: fileData.mimetype,
      size: fileData.size,
      path: fileData.path,
      url: fileData.url,
    };
  }

  return updated;
}

// ------------------------------
// CRUD FUNCTIONS
// ------------------------------

// GET ALL CONTACTS
async function getAllContacts() {
  const result = await docClient.send(
    new ScanCommand({ TableName: CONTACTS_TABLE })
  );

  return result.Items || [];
}

// GET SINGLE CONTACT
async function getContactById(id) {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONTACTS_TABLE,
      Key: { id },
    })
  );

  return result.Item;
}

// CREATE CONTACT
async function createContactRecord(data, fileData = null) {
  const error = validateContact(data);
  if (error) throw new Error(error);

  const item = formatNewContact(data, fileData);

  await docClient.send(
    new PutCommand({
      TableName: CONTACTS_TABLE,
      Item: item,
    })
  );

  return item;
}

// UPDATE CONTACT (including resume)
async function updateContactRecord(id, updates, fileData = null) {
  const existing = await getContactById(id);
  if (!existing) throw new Error("Contact not found");

  const updated = formatUpdatedContact(existing, updates, fileData);

  await docClient.send(
    new PutCommand({
      TableName: CONTACTS_TABLE,
      Item: updated,
    })
  );

  return updated;
}

// DELETE CONTACT
async function deleteContactRecord(id) {
  const existing = await getContactById(id);
  if (!existing) throw new Error("Contact not found");

  await docClient.send(
    new DeleteCommand({
      TableName: CONTACTS_TABLE,
      Key: { id },
    })
  );

  return { message: "Contact deleted successfully" };
}

// ADD REPLY
async function addReplyToContact(id, replyData) {
  const contact = await getContactById(id);
  if (!contact) throw new Error("Contact not found");

  const reply = {
    message: replyData.message,
    repliedBy: replyData.repliedBy,
    repliedAt: Date.now(),
  };

  contact.replies = contact.replies || [];
  contact.replies.push(reply);

  contact.status = "replied";
  contact.updatedAt = Date.now();

  await docClient.send(
    new PutCommand({
      TableName: CONTACTS_TABLE,
      Item: contact,
    })
  );

  return contact;
}

// ------------------------------
// EXPORTS
// ------------------------------
module.exports = {
  CONTACTS_TABLE,
  getAllContacts,
  getContactById,
  createContactRecord,
  updateContactRecord,
  deleteContactRecord,
  addReplyToContact,
};
