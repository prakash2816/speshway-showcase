const express = require("express");
const router = express.Router();

const {
  registerUser,
  authUser,
  getMe,
  getUsers, // make sure this is exported from your controller
} = require("../controllers/authControllerDynamo");

const { protect } = require("../middleware/authMiddlewareDynamo");

// ------------------------
// Auth Routes
// ------------------------

// Register User
router.post("/register", registerUser);

// Login User
router.post("/login", authUser);

// Get Current User (protected)
router.get("/me", protect, getMe);

// ------------------------
// Users Routes
// ------------------------

// Get All Users
router.get("/users", getUsers);

module.exports = router;
