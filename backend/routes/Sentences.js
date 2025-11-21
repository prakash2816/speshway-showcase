// backend/routes/sentences.js

const express = require('express');
const router = express.Router();

const {
  getSentences,
  getSentence,
  createSentence,
  updateSentence,
  deleteSentence
} = require('../controllers/sentenceControllerDynamo');

const { protect, admin } = require('../middleware/authMiddlewareDynamo');

// ------------------------------
// PUBLIC ROUTES
// ------------------------------
router.get('/', getSentences);
router.post('/', createSentence);

// ------------------------------
// ADMIN PROTECTED ROUTES
// ------------------------------
router.get('/:id', getSentence);
router.put('/:id', protect, admin, updateSentence);
router.delete('/:id', protect, admin, deleteSentence);

module.exports = router;
