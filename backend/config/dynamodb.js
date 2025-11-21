const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const connectDB = () => {
  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "ap-south-1",
      // ⚠️ In Lambda, credentials are automatic — no need to set manually
    });

    const ddb = DynamoDBDocumentClient.from(client);

    console.log("DynamoDB Connected Successfully");
    return ddb;
  } catch (error) {
    console.error("DynamoDB Connection Error:", error.message);
    throw new Error("Failed to connect to DynamoDB");
  }
};

module.exports = connectDB;
