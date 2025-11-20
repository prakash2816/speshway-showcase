// models/Sentence.js
const { v4: uuidv4 } = require("uuid");
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

const TABLE_NAME = "Sentences";

// =============================================================
// CREATE SENTENCE
// =============================================================
exports.createSentence = async (data, userAgent) => {
  const id = uuidv4();
  const timestamp = data.timestamp || new Date().toISOString();

  const item = {
    id,
    text: data.text,
    url: data.url,
    userAgent: userAgent || "",
    timestamp
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    })
  );

  return item;
};

// =============================================================
// GET ALL SENTENCES
// =============================================================
exports.getAllSentences = async () => {
  const result = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME
    })
  );

  return result.Items || [];
};

// =============================================================
// GET SENTENCE BY ID
// =============================================================
exports.getSentenceById = async (id) => {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id }
    })
  );

  return result.Item;
};

// =============================================================
// UPDATE SENTENCE
// =============================================================
exports.updateSentenceById = async (id, fields) => {
  const UpdateExpression = [];
  const ExpressionAttributeValues = {};

  if (fields.text) {
    UpdateExpression.push("text = :t");
    ExpressionAttributeValues[":t"] = fields.text;
  }

  if (fields.url) {
    UpdateExpression.push("url = :u");
    ExpressionAttributeValues[":u"] = fields.url;
  }

  if (fields.userAgent) {
    UpdateExpression.push("userAgent = :a");
    ExpressionAttributeValues[":a"] = fields.userAgent;
  }

  if (fields.timestamp) {
    UpdateExpression.push("timestamp = :ts");
    ExpressionAttributeValues[":ts"] = fields.timestamp;
  }

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "SET " + UpdateExpression.join(", "),
      ExpressionAttributeValues
    })
  );

  return { id, ...fields };
};

// =============================================================
// DELETE SENTENCE
// =============================================================
exports.deleteSentenceById = async (id) => {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id }
    })
  );

  return { message: "Sentence removed" };
};
