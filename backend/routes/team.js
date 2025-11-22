const express = require("express");
const router = express.Router();
const multer = require("multer");

// Multer for image upload
const { uploadTeamImage } = require("../config/cloudinaryDynamo");

// Controllers
const {
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
} = require("../controllers/teamController");

// ====================================================================
// GET ALL TEAM MEMBERS
// Route: GET /api/team
// Public
// ====================================================================
router.get("/", getTeamMembers);

// ====================================================================
// GET SINGLE TEAM MEMBER
// Route: GET /api/team/:id
// Public
// ====================================================================
router.get("/:id", getTeamMember);

// ====================================================================
// CREATE TEAM MEMBER
// Route: POST /api/team
// Body: { name, role, ... }
// Upload: image (optional)
// ====================================================================
router.post("/", upload.single("image"), createTeamMember);

// ====================================================================
// UPDATE TEAM MEMBER
// Route: PUT /api/team/:id
// Upload: image (optional)
// ====================================================================
router.put("/:id", upload.single("image"), updateTeamMember);

// ====================================================================
// DELETE TEAM MEMBER
// Route: DELETE /api/team/:id
// ====================================================================
router.delete("/:id", deleteTeamMember);

module.exports = router;
