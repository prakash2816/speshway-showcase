// backend/routes/auth.js

const express = require("express");
const router = express.Router();

const {
  registerUser,
  authUser,
  getMe,
  getUsers,
} = require("../controllers/authControllerDynamo");

const { protect, admin } = require("../middleware/authMiddlewareDynamo");

// ------------------------
// AUTH ROUTES
// ------------------------

// Register a new user
router.post("/register", registerUser);

// Login user
router.post("/login", authUser);

// Get current logged-in user (protected route)
router.get("/me", protect, getMe);

// ------------------------
// USERS ROUTES
// ------------------------

// Get all users (admin protected if needed)
router.get("/users", protect, admin, getUsers);

module.exports = router;
