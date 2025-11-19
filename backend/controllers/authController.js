const { GetCommand, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectDB = require("../config/dynamodb");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Get DynamoDB DocumentClient
const ddb = connectDB();
const TABLE_NAME = "SpeshwayUsers"; // Make sure to use a single table name

// ------------------------------------------------------------
// @desc    Register User
// @route   POST /api/auth/register
// ------------------------------------------------------------
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const existingUser = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { email } })
    );

    if (existingUser.Item) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user in DynamoDB
    const newUser = {
      email,
      name,
      password: hashedPassword,
      role: role || "user",
      createdAt: new Date().toISOString(),
    };

    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: newUser }));

    // Return response
    res.status(201).json({
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      token: generateToken(newUser.email),
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// @desc    Login User
// @route   POST /api/auth/login
// ------------------------------------------------------------
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userData = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { email } })
    );

    const user = userData.Item;
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      email: user.email,
      name: user.name,
      role: user.role,
      token: generateToken(user.email),
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// @desc    Get logged-in user profile
// @route   GET /api/auth/me
// ------------------------------------------------------------
const getMe = async (req, res) => {
  try {
    const email = req.user.email;

    const userData = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { email } })
    );

    if (!userData.Item) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userData.Item;
    delete user.password; // remove password
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// @desc    Get all users
// @route   GET /api/users
// ------------------------------------------------------------
const getUsers = async (req, res) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
    res.json(result.Items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerUser, authUser, getMe, getUsers };
