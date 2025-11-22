const express = require("express");
const router = express.Router();

// Controllers
const {
  getSentences,
  getSentence,
  createSentence,
  updateSentence,
  deleteSentence
} = require("../controllers/sentencesController");

// ------------------------------------------------------------
// GET ALL SENTENCES (Public)
// Route: GET /api/sentences
// ------------------------------------------------------------
router.get("/", getSentences);

// ------------------------------------------------------------
// GET SINGLE SENTENCE (Public)
// Route: GET /api/sentences/:id
// ------------------------------------------------------------
router.get("/:id", getSentence);

// ------------------------------------------------------------
// CREATE SENTENCE (Public)
// Route: POST /api/sentences
// Body: { text, url? }
// ------------------------------------------------------------
router.post("/", createSentence);

// ------------------------------------------------------------
// UPDATE SENTENCE (Optional Protected)
// Route: PUT /api/sentences/:id
// ------------------------------------------------------------
router.put("/:id", updateSentence);

// ------------------------------------------------------------
// DELETE SENTENCE (Optional Protected)
// Route: DELETE /api/sentences/:id
// ------------------------------------------------------------
router.delete("/:id", deleteSentence);

module.exports = router;
