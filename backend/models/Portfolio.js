// portfolio.dynamodb.js
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Portfolio";

/**
 * Create Portfolio
 */
exports.createPortfolio = async (data) => {
  const id = uuidv4();
  const timestamp = Date.now();

  const item = {
    PK: `portfolio#${id}`,
    SK: "meta",

    id,
    title: data.title,
    category: data.category,
    description: data.description,

    technologies: data.technologies || [],

    color: data.color || "from-blue-500/20 to-cyan-500/20",

    image: {
      url: data.image?.url || "",
      publicId: data.image?.publicId || "",
    },

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
 * Get Portfolio by ID
 */
exports.getPortfolioById = async (id) => {
  const result = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: {
        PK: `portfolio#${id}`,
        SK: "meta",
      },
    })
    .promise();

  return result.Item;
};

/**
 * Update Portfolio
 */
exports.updatePortfolio = async (id, updates) => {
  const timestamp = Date.now();

  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `portfolio#${id}`,
      SK: "meta",
    },

    UpdateExpression: `
      set
        title = :title,
        category = :category,
        description = :description,
        technologies = :technologies,
        color = :color,
        image = :image,
        updatedAt = :updatedAt
    `,
    ExpressionAttributeValues: {
      ":title": updates.title,
      ":category": updates.category,
      ":description": updates.description,
      ":technologies": updates.technologies || [],
      ":color": updates.color || "from-blue-500/20 to-cyan-500/20",
      ":image": updates.image || { url: "", publicId: "" },
      ":updatedAt": timestamp,
    },
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamodb.update(params).promise();
  return result.Attributes;
};

/**
 * Delete Portfolio
 */
exports.deletePortfolio = async (id) => {
  await dynamodb
    .delete({
      TableName: TABLE_NAME,
      Key: {
        PK: `portfolio#${id}`,
        SK: "meta",
      },
    })
    .promise();

  return { message: "Portfolio deleted successfully" };
};
