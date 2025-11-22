const express = require("express");
const router = express.Router();

const {
  registerUser,
  authUser,
  getMe,
  getUsers
} = require("../controllers/authController");

// Middleware (JWT Protection)
const { protect } = require("../middleware/authMiddleware");

// ------------------------------------------------------------
// Register User
// Route: POST /api/auth/register
// ------------------------------------------------------------
router.post("/register", registerUser);

// ------------------------------------------------------------
// Login User
// Route: POST /api/auth/login
// ------------------------------------------------------------
router.post("/login", authUser);

// ------------------------------------------------------------
// Get Logged-in User
// Route: GET /api/auth/me
// Protected
// ------------------------------------------------------------
router.get("/me", protect, getMe);

// ------------------------------------------------------------
// Get All Users (Admin Only)
// Route: GET /api/auth/users
// Protected + Admin
// ------------------------------------------------------------
router.get("/users", protect, getUsers);

module.exports = router;
