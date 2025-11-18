// service.dynamodb.js
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Service";

/**
 * Create Service
 */
exports.createService = async (data) => {
  const id = uuidv4();
  const timestamp = Date.now();

  const item = {
    PK: `service#${id}`,
    SK: "meta",

    id,
    title: data.title,
    description: data.description,
    features: data.features || [],
    icon: data.icon || "Code",

    createdAt: timestamp,
    updatedAt: timestamp,
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
 * Get Service by ID
 */
exports.getServiceById = async (id) => {
  const result = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: {
        PK: `service#${id}`,
        SK: "meta",
      },
    })
    .promise();

  return result.Item;
};

/**
 * Get All Services
 */
exports.getAllServices = async () => {
  const result = await dynamodb
    .scan({
      TableName: TABLE_NAME,
    })
    .promise();

  return result.Items;
};

/**
 * Update Service
 */
exports.updateService = async (id, data) => {
  const existing = await exports.getServiceById(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...data,
    updatedAt: Date.now(),
  };

  await dynamodb
    .put({
      TableName: TABLE_NAME,
      Item: updated,
    })
    .promise();

  return updated;
};

/**
 * Delete Service
 */
exports.deleteService = async (id) => {
  await dynamodb
    .delete({
      TableName: TABLE_NAME,
      Key: {
        PK: `service#${id}`,
        SK: "meta",
      },
    })
    .promise();

  return { message: "Service deleted successfully" };
};
