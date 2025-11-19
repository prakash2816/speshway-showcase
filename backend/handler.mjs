import AWS from "aws-sdk";

const dynamo = new AWS.DynamoDB.DocumentClient();

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

export const main = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return response(200, { message: "CORS preflight OK" });
    }

    // Split path, e.g., "/api/clients" → ["api", "clients"]
    const pathParts = event.path.split("/").filter(Boolean);
    const tableKey = pathParts[1]; // clients, contacts, etc.

    if (!TABLES[tableKey]) {
      return response(404, { message: "Route not found" });
    }

    // For now, simple GET: return all items
    if (event.httpMethod === "GET") {
      const params = { TableName: TABLES[tableKey] };
      const data = await dynamo.scan(params).promise();
      return response(200, { data: data.Items || [] });
    }

    // Optional: implement POST/PUT/DELETE if needed
    return response(400, { message: "Method not supported yet" });

  } catch (err) {
    console.error(err);
    return response(500, { message: "Internal Server Error", error: err.message });
  }
};
