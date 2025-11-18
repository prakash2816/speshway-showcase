// handler.js
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "ap-south-1" });

// Map table names here
const TABLES = {
  users: "UsersTable",
  orders: "OrdersTable",
  products: "ProductsTable",
  categories: "CategoriesTable",
  payments: "PaymentsTable",
  reviews: "ReviewsTable",
  carts: "CartsTable",
  logs: "LogsTable"
};

// Helper to handle responses
const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

// Lambda handler
export const handler = async (event) => {
  try {
    const { table, action, payload, key } = JSON.parse(event.body);

    if (!TABLES[table]) return response(400, { error: "Invalid table name" });

    switch (action) {
      case "get":
        if (!key) return response(400, { error: "Missing key for get" });
        const getCommand = new GetItemCommand({
          TableName: TABLES[table],
          Key: key
        });
        const getResult = await client.send(getCommand);
        return response(200, getResult.Item || {});

      case "scan":
        const scanCommand = new ScanCommand({ TableName: TABLES[table] });
        const scanResult = await client.send(scanCommand);
        return response(200, scanResult.Items || []);

      case "put":
        if (!payload) return response(400, { error: "Missing payload for put" });
        const putCommand = new PutItemCommand({
          TableName: TABLES[table],
          Item: payload
        });
        await client.send(putCommand);
        return response(200, { message: "Item inserted successfully" });

      case "update":
        if (!key || !payload) return response(400, { error: "Missing key or payload for update" });
        const updateCommand = new UpdateItemCommand({
          TableName: TABLES[table],
          Key: key,
          AttributeUpdates: payload
        });
        await client.send(updateCommand);
        return response(200, { message: "Item updated successfully" });

      case "delete":
        if (!key) return response(400, { error: "Missing key for delete" });
        const deleteCommand = new DeleteItemCommand({
          TableName: TABLES[table],
          Key: key
        });
        await client.send(deleteCommand);
        return response(200, { message: "Item deleted successfully" });

      default:
        return response(400, { error: "Invalid action" });
    }
  } catch (err) {
    return response(500, { error: err.message });
  }
};
