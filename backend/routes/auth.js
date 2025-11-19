const express = require("express");
const router = express.Router();

const {
  registerUserDynamo,
  authUserDynamo,
  getMeDynamo,
  getUsersDynamo, // make sure this is exported from your controller
} = require("../controllers/authController");

const { protectDynamo } = require("../middleware/authMiddleware");

// ------------------------
// Auth Routes
// ------------------------

// Register User
router.post("/register", registerUserDynamo);

// Login User
router.post("/login", authUserDynamo);

// Get Current User (protected)
router.get("/me", protectDynamo, getMeDynamo);

// ------------------------
// Users Routes
// ------------------------

// Get All Users
router.get("/users", getUsersDynamo);

module.exports = router;
