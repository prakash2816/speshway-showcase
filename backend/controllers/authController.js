const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectDB = require("../config/db");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Get DynamoDB DocumentClient
const ddb = connectDB();
const TABLE_NAME = "SpeshwayUsers";

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

    // 1️⃣ Check if user exists
    const existingUser = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { email },
      })
    );

    if (existingUser.Item) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Store user in DynamoDB
    const newUser = {
      email,
      name,
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

    // 4️⃣ Return response
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
    // 1️⃣ Get user from DB
    const userData = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { email },
      })
    );

    const user = userData.Item;

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3️⃣ Return response
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

    // Fetch user
    const userData = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { email },
      })
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

module.exports = { registerUser, authUser, getMe };
