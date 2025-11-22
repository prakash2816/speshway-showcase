// backend/handler.js (CommonJS)
const serverless = require("serverless-http");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { DynamoDBClient, ScanCommand, ListTablesCommand } = require("@aws-sdk/client-dynamodb");

// Load ENV
dotenv.config();

// DynamoDB Client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1"
});

// Express App
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------
// ✅ CORS CONFIG
// ----------------------------
const corsOptions = {
  origin: [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));

// ----------------------------
// ✅ STATIC UPLOADS (LOCAL BACKUP)
// ----------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ----------------------------
// ✅ TABLE MAPPING
// ----------------------------
const TABLES = {
  clients: "Clients",
  contacts: "ContactTable",
  gallery: "GalleryTable",
  portfolio: "Portfolios",
  sentences: "Sentences",
  services: "Services",
  team: "Team",        // ✅ FIXED
  users: "Users"
};

// ----------------------------
// ✅ RAW TABLE GET (DEV / TESTING ONLY)
// ----------------------------
app.get("/api/raw/:table", async (req, res) => {
  try {
    const tableKey = req.params.table.toLowerCase();
    if (!TABLES[tableKey]) {
      return res.status(404).json({ message: "Table not found" });
    }

    const data = await dynamoClient.send(
      new ScanCommand({ TableName: TABLES[tableKey] })
    );

    res.json({ data: data.Items || [] });
  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
});

// ----------------------------
// ✅ API ROUTES
// ----------------------------
app.use("/api/auth", require("./routes/auth"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/services", require("./routes/services"));
app.use("/api/portfolios", require("./routes/portfolios"));
app.use("/api/team", require("./routes/team"));       // ✅ Uses protect + admin
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/clients", require("./routes/clients"));
app.use("/api/sentences", require("./routes/sentences"));

// ----------------------------
// ✅ HEALTH CHECK
// ----------------------------
app.get("/", (req, res) => {
  res.json({
    message: "API running",
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await dynamoClient.send(new ListTablesCommand({}));
    res.json({ status: "ok", dynamodb: "connected" });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "DynamoDB connection failed",
      error: err.message
    });
  }
});

// ----------------------------
// ✅ GLOBAL ERROR HANDLER
// ----------------------------
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size too large. Max 5MB"
    });
  }
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message
  });
});

// ----------------------------
// ✅ EXPORT FOR SERVERLESS
// ----------------------------
module.exports.main = serverless(app);

// ----------------------------
// ✅ OPTIONAL RAW LAMBDA
// ----------------------------
module.exports.rawLambda = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, body: "CORS OK" };
    }

    const pathParts = event.path.split("/").filter(Boolean);
    const tableKey = pathParts[pathParts.length - 1].toLowerCase();

    if (!TABLES[tableKey]) {
      return { statusCode: 404, body: "Table not found" };
    }

    if (event.httpMethod === "GET") {
      const data = await dynamoClient.send(
        new ScanCommand({ TableName: TABLES[tableKey] })
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ data: data.Items || [] })
      };
    }

    return { statusCode: 400, body: "Method not supported" };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: err.message
      })
    };
  }
};
