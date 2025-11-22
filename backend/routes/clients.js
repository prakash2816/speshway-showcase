const express = require("express");
const router = express.Router();

const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
} = require("../controllers/clientsController");

// JWT Middleware
const { protect } = require("../middleware/authMiddleware");

// ------------------------------------------------------------
// GET ALL CLIENTS
// Route: GET /api/clients
// Public (shows only active clients)
// Admin/HR: add ?all=true to see all
// ------------------------------------------------------------
router.get("/", getClients);

// ------------------------------------------------------------
// GET SINGLE CLIENT
// Route: GET /api/clients/:id
// Public
// ------------------------------------------------------------
router.get("/:id", getClient);

// ------------------------------------------------------------
// CREATE CLIENT
// Route: POST /api/clients
// Protected (Admin / HR Only)
// ------------------------------------------------------------
router.post("/", protect, createClient);

// ------------------------------------------------------------
// UPDATE CLIENT
// Route: PUT /api/clients/:id
// Protected (Admin / HR Only)
// ------------------------------------------------------------
router.put("/:id", protect, updateClient);

// ------------------------------------------------------------
// DELETE CLIENT
// Route: DELETE /api/clients/:id
// Protected (Admin / HR Only)
// ------------------------------------------------------------
router.delete("/:id", protect, deleteClient);

module.exports = router;
