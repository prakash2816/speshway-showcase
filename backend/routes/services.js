const express = require("express");
const router = express.Router();

// Controllers
const {
  getServicesDynamo,
  getService,
  createService,
  updateService,
  deleteService
} = require("../controllers/servicesControllerDynamo");

// ==========================================================
// GET ALL SERVICES
// Route: GET /api/services
// Public
// ==========================================================
router.get("/", getServicesDynamo);

// ==========================================================
// GET SINGLE SERVICE
// Route: GET /api/services/:id
// Public
// ==========================================================
router.get("/:id", getService);

// ==========================================================
// CREATE SERVICE
// Route: POST /api/services
// Body: { name, ... }
// Optional: Protect if needed
// ==========================================================
router.post("/", createService);

// ==========================================================
// UPDATE SERVICE
// Route: PUT /api/services/:id
// Optional: Protect if needed
// ==========================================================
router.put("/:id", updateService);

// ==========================================================
// DELETE SERVICE
// Route: DELETE /api/services/:id
// Optional: Protect if needed
// ==========================================================
router.delete("/:id", deleteService);

module.exports = router;
