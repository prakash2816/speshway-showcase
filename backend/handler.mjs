// backend/handler.mjs
import AWS from "aws-sdk";

const dynamo = new AWS.DynamoDB.DocumentClient();

// Map route keys to DynamoDB table names
const TABLES = {
  clients: "SpeshwayClients",
  contacts: "SpeshwayContacts",
  gallery: "SpeshwayGallery",
  portfolio: "SpeshwayPortfolio",
  sentences: "SpeshwaySentences",
  services: "SpeshwayServices",
  team: "SpeshwayTeam",
  users: "SpeshwayUsers",
};

// Standard API response
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "*",
  },
  body: JSON.stringify(body),
});

// Lambda handler
export const main = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return response(200, { message: "CORS preflight OK" });
  }

  try {
    // Example path: "/api/clients" → ["api", "clients"]
    const pathParts = event.path.split("/").filter(Boolean);
    const tableKey = pathParts[1]; // "clients", "gallery", etc.

    if (!TABLES[tableKey]) {
      return response(404, { message: "Route not found" });
    }

    // Fetch all items from DynamoDB table
    const params = { TableName: TABLES[tableKey] };
    const data = await dynamo.scan(params).promise();

    return response(200, { data: data.Items || [] });
  } catch (err) {
    console.error(err);
    return response(500, { message: "Internal Server Error", error: err.message });
  }
};
