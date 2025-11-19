import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

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

    return ddb; // return DynamoDB instance to use in controllers
  } catch (error) {
    console.error("DynamoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
