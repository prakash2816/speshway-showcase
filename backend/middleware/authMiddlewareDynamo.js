const jwt = require("jsonwebtoken");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

// DynamoDB Client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Users Table Name
const USERS_TABLE = process.env.USERS_TABLE || "Users";

// ======================================
// PROTECT (Requires Login)
// ======================================
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DynamoDB
    const { Item } = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { id: decoded.id }
      })
    );

    if (!Item) {
      return res.status(401).json({ message: "User not found" });
    }

    // Remove password before attaching
    const { password, ...userData } = Item;

    req.user = userData;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// ======================================
// OPTIONAL PROTECT (Token Optional)
// ======================================
const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { Item } = await docClient.send(
        new GetCommand({
          TableName: USERS_TABLE,
          Key: { id: decoded.id }
        })
      );

      if (Item) {
        const { password, ...userData } = Item;
        req.user = userData;
      } else {
        req.user = undefined;
      }
    }
  } catch (error) {
    req.user = undefined;
  }

  next();
};

// ======================================
// ADMIN / HR ONLY
// ======================================
const admin = (req, res, next) => {
  if (req.user && ["admin", "hr"].includes(req.user.role)) {
    return next();
  }
  return res.status(401).json({ message: "Not authorized as admin" });
};

module.exports = { protect, optionalProtect, admin };
