const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GetCommand, PutCommand, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const connectDB = require("../config/dynamodb");

// DynamoDB client
const ddb = connectDB();

// Table Name
const TABLE_NAME = "Users";

// -------------------------------
// Generate JWT Token
// -------------------------------
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// -------------------------------
// Register User
// -------------------------------
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists using Scan (or GSI if configured)
    const existing = await ddb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );

    if (existing.Items && existing.Items.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      createdAt: new Date().toISOString(),
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newUser,
      })
    );

    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token: generateToken(newUser.id),
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server Error: " + error.message });
  }
};

// -------------------------------
// Login User
// -------------------------------
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email using Scan (or GSI if configured)
    const result = await ddb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );

    const user = result.Items?.[0];
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error: " + error.message });
  }
};

// -------------------------------
// Get Logged-in User
// -------------------------------
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: userId },
      })
    );

    if (!result.Item) return res.status(404).json({ message: "User not found" });

    const { password, ...userData } = result.Item; // remove password
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: "Server Error: " + error.message });
  }
};

// -------------------------------
// Get All Users (Admin Only)
// -------------------------------
const getUsers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await ddb.send(
      new ScanCommand({ TableName: TABLE_NAME })
    );

    const users = result.Items.map(u => {
      const { password, ...data } = u;
      return data;
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error: " + error.message });
  }
};

module.exports = {
  registerUser,
  authUser,
  getMe,
  getUsers,
};
