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

// Public routes
router
  .route('/')
  .get(getSentences)
  .post(createSentence);

// Admin protected routes
router
  .route('/:id')
  .get(getSentence)
  .put(protect, admin, updateSentence)
  .delete(protect, admin, deleteSentence);

module.exports = router;
