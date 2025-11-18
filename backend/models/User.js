// user.dynamodb.js
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Users";

/**
 * Create User
 */
exports.createUser = async (data) => {
  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const item = {
    PK: `user#${id}`,
    SK: "meta",

    id,
    name: data.name,
    email: data.email.toLowerCase(),
    password: hashedPassword,
    role: data.role || "user",
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
 * Get User By Email
 */
exports.getUserByEmail = async (email) => {
  const result = await dynamodb
    .scan({
      TableName: TABLE_NAME,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email.toLowerCase(),
      },
    })
    .promise();

  return result.Items.length > 0 ? result.Items[0] : null;
};

/**
 * Get User By ID
 */
exports.getUserById = async (id) => {
  const result = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: {
        PK: `user#${id}`,
        SK: "meta",
      },
    })
    .promise();

  return result.Item || null;
};

/**
 * Compare Password (like matchPassword method)
 */
exports.matchPassword = async (enteredPassword, storedHash) => {
  return await bcrypt.compare(enteredPassword, storedHash);
};
