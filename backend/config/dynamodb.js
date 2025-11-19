const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const connectDB = () => {
  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const ddb = DynamoDBDocumentClient.from(client);

    console.log("DynamoDB Connected Successfully");
    return ddb;
  } catch (error) {
    console.error("DynamoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
