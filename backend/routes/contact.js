const express = require("express");
const router = express.Router();

const {
  uploadDynamo,
  submitContactDynamo,
  getSubmissionsDynamo
} = require("../controllers/contactControllerDynamo");

// ------------------------------------------------------------
// Submit Contact / Resume
// Route: POST /api/contact
// If uploading a resume → field name must be "resume"
// ------------------------------------------------------------
router.post(
  "/",
  uploadDynamo.single("resume"), // Handles file upload if included
  submitContactDynamo
);

// ------------------------------------------------------------
// Get All Submissions (Admin Only if needed)
// Route: GET /api/contact
// ------------------------------------------------------------
router.get("/", getSubmissionsDynamo);

module.exports = router;
