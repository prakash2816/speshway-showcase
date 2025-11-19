const express = require('express');
const router = express.Router();
const multer = require('multer');

// Multer setup for memory storage (works well with Lambda)
const uploadDynamo = multer({ storage: multer.memoryStorage() });

const {
  submitContactDynamo,
  getSubmissionsDynamo,
  getSubmissionDynamo,
  updateSubmissionStatusDynamo,
  replyToSubmissionDynamo,
  deleteSubmissionDynamo
} = require('../controllers/contactControllerDynamo');

const {
  protectDynamo,
  adminDynamo
} = require('../middleware/authMiddlewareDynamo');

// Public route: submit contact form with resume upload
router.post('/submit', uploadDynamo.single('resume'), submitContactDynamo);

// Admin routes (protected)
router.get('/submissions', protectDynamo, adminDynamo, getSubmissionsDynamo);
router.get('/submission/:id', protectDynamo, adminDynamo, getSubmissionDynamo);
router.put('/submission/:id/status', protectDynamo, adminDynamo, updateSubmissionStatusDynamo);
router.post('/submission/:id/reply', protectDynamo, adminDynamo, replyToSubmissionDynamo);
router.delete('/submission/:id', protectDynamo, adminDynamo, deleteSubmissionDynamo);

module.exports = router;
