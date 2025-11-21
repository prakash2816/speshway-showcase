// backend/handler.js (CommonJS)
const { DynamoDBClient, ScanCommand, ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const serverless = require("serverless-http");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

// -----------------------------
// ENV
// -----------------------------
dotenv.config();

// -----------------------------
// DYNAMODB CLIENT
// -----------------------------
const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });

// -----------------------------
// EXPRESS APP SETUP
// -----------------------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:3000",
    "http://serverless-framework-deployments-ap-south-1-1d23c6b6-2eb9.s3-website.ap-south-1.amazonaws.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
};
app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -----------------------------
// TABLES MAPPING
// -----------------------------
const TABLES = {
  clients: "Clients",
  contacts: "Contacts",
  gallery: "Gallery",
  portfolio: "Portfolios",
  sentences: "Sentences",
  services: "SpeshwayServices",
  team: "TABLE_NAME",
  users: "Users",
};

// -----------------------------
// SIMPLE RAW GET ENDPOINT
// -----------------------------
app.get("/api/raw/:table", async (req, res) => {
  try {
    const tableKey = req.params.table.toLowerCase();
    if (!TABLES[tableKey]) return res.status(404).json({ message: "Table not found" });

    const data = await dynamoClient.send(new ScanCommand({ TableName: TABLES[tableKey] }));
    res.json({ data: data.Items || [] });
  } catch (err) {
    console.error("RAW GET ERROR:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// -----------------------------
// IMPORT OTHER EXPRESS ROUTES
// -----------------------------
app.use("/api/auth", require("./routes/auth.js"));
app.use("/api/contact", require("./routes/contact.js"));
app.use("/api/services", require("./routes/services.js"));
app.use("/api/portfolios", require("./routes/portfolios.js"));
app.use("/api/team", require("./routes/team.js"));
app.use("/api/gallery", require("./routes/gallery.js"));
app.use("/api/clients", require("./routes/clients.js"));
app.use("/api/sentences", require("./routes/Sentences.js"));

// -----------------------------
// HEALTH CHECK ROUTES
// -----------------------------
app.get("/", (req, res) => {
  res.json({ message: "API running", status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health", async (req, res) => {
  try {
    await dynamoClient.send(new ListTablesCommand({}));
    res.json({ status: "ok", message: "Backend & DynamoDB healthy ✔️", dynamodb: "connected" });
  } catch (err) {
    console.error("HEALTH CHECK ERROR:", err);
    res.status(500).json({ status: "error", message: "DynamoDB connection failed ❌", error: err.message });
  }
});

// -----------------------------
// GLOBAL ERROR HANDLER
// -----------------------------
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File size too large. Max 5MB" });
  }
  console.error("GLOBAL ERROR:", error);
  res.status(500).json({ success: false, message: "Internal server error", error: error.message });
});

// -----------------------------
// EXPORT FOR SERVERLESS
// -----------------------------
module.exports.main = serverless(app);

// -----------------------------
// OPTIONAL RAW LAMBDA HANDLER
// -----------------------------
module.exports.rawLambda = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, body: "CORS OK" };

    const pathParts = event.path.split("/").filter(Boolean);
    const tableKey = pathParts[pathParts.length - 1].toLowerCase(); // always take last part
    if (!TABLES[tableKey]) return { statusCode: 404, body: "Table not found" };

    if (event.httpMethod === "GET") {
      const data = await dynamoClient.send(new ScanCommand({ TableName: TABLES[tableKey] }));
      return { statusCode: 200, body: JSON.stringify({ data: data.Items || [] }) };
    }

    return { statusCode: 400, body: "Method not supported" };
  } catch (err) {
    console.error("RAW LAMBDA ERROR:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal Server Error", error: err.message }) };
  }
};
