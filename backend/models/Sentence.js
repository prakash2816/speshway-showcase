// sentence.dynamodb.js
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Sentence";

/**
 * Create Sentence
 */
exports.createSentence = async (data) => {
  const id = uuidv4();
  const timestamp = Date.now();

  const item = {
    PK: `sentence#${id}`,
    SK: "meta",

    id,
    text: data.text,
    url: data.url,

    timestamp: data.timestamp || timestamp,
    userAgent: data.userAgent || "",

    recordedAt: timestamp,
  };

  await dynamodb
    .put({
      TableName: TABLE_NAME,
      Item: item,
    })
    .promise();

  return item;
};

/**
 * Get Sentence by ID
 */
exports.getSentenceById = async (id) => {
  const result = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: {
        PK: `sentence#${id}`,
        SK: "meta",
      },
    })
    .promise();

  return result.Item;
};

/**
 * Get All Sentences (scan)
 */
exports.getAllSentences = async () => {
  const result = await dynamodb
    .scan({
      TableName: TABLE_NAME,
    })
    .promise();

  return result.Items;
};

/**
 * Delete Sentence
 */
exports.deleteSentence = async (id) => {
  await dynamodb
    .delete({
      TableName: TABLE_NAME,
      Key: {
        PK: `sentence#${id}`,
        SK: "meta",
      },
    })
    .promise();

  return { message: "Sentence deleted successfully" };
};
