// backend/handler.mjs
import AWS from "aws-sdk";
import serverless from "serverless-http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import multer from "multer";
import dynamoClient from "./config/dynamodb.js";
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { fileURLToPath } from "url";

// -----------------------------
// ENV + __dirname for ES modules
// -----------------------------
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
};
app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -----------------------------
// SIMPLE DYNAMODB DIRECT GET (RAW HANDLER LOGIC)
// -----------------------------
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

// Optional raw DynamoDB GET endpoint
app.get("/api/raw/:table", async (req, res) => {
  try {
    const tableKey = req.params.table;
    if (!TABLES[tableKey]) return res.status(404).json({ message: "Table not found" });

    const data = await dynamoClient.scan({ TableName: TABLES[tableKey] });
    return res.json({ data: data.Items || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// -----------------------------
// IMPORT ALL OTHER EXPRESS ROUTES
// -----------------------------
app.use("/api/auth", (await import("./routes/auth.js")).default);
app.use("/api/contact", (await import("./routes/contact.js")).default);
app.use("/api/services", (await import("./routes/services.js")).default);
app.use("/api/portfolios", (await import("./routes/portfolios.js")).default);
app.use("/api/team", (await import("./routes/team.js")).default);
app.use("/api/gallery", (await import("./routes/gallery.js")).default);
app.use("/api/clients", (await import("./routes/clients.js")).default);
app.use("/api/sentences", (await import("./routes/sentences.js")).default);

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
  res.status(500).json({ success: false, message: "Internal server error", error: error.message });
});

// -----------------------------
// EXPORT FOR SERVERLESS
// -----------------------------
export const main = serverless(app);

// -----------------------------
// OPTIONAL RAW LAMBDA HANDLER FOR DIRECT API GATEWAY EVENTS
// -----------------------------
export const rawLambda = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, body: "CORS OK" };

    const pathParts = event.path.split("/").filter(Boolean);
    const tableKey = pathParts[1];
    if (!TABLES[tableKey]) return { statusCode: 404, body: "Route not found" };

    if (event.httpMethod === "GET") {
      const params = { TableName: TABLES[tableKey] };
      const data = await dynamoClient.scan(params).promise();
      return { statusCode: 200, body: JSON.stringify({ data: data.Items || [] }) };
    }

    return { statusCode: 400, body: "Method not supported" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal Server Error", error: err.message }) };
  }
};
