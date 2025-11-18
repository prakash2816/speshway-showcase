const express = require('express');
const router = express.Router();

const {
  getSentencesDynamo,
  getSentenceDynamo,
  createSentenceDynamo,
  updateSentenceDynamo,
  deleteSentenceDynamo
} = require('../controllers/sentenceControllerDynamo');

const { protectDynamo, adminDynamo } = require('../middleware/authMiddlewareDynamo');

// Public routes
router
  .route('/')
  .get(getSentencesDynamo)
  .post(createSentenceDynamo);

// Admin protected routes
router
  .route('/:id')
  .get(getSentenceDynamo)
  .put(protectDynamo, adminDynamo, updateSentenceDynamo)
  .delete(protectDynamo, adminDynamo, deleteSentenceDynamo);

module.exports = router;
