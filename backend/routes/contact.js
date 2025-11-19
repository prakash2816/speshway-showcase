const express = require('express');
const router = express.Router();
const multer = require('multer');

// Multer setup for memory storage (works well with Lambda)
const upload = multer({ storage: multer.memoryStorage() });

const {
  submitContactDynamo,
  getSubmissionsDynamo,
  getSubmission,
  updateSubmissionStatus,
  replyToSubmission,
  deleteSubmission
} = require('../controllers/contactControllerDynamo');

const {
  protect,
  admin
} = require('../middleware/authMiddlewareDynamo');

// Public route: submit contact form with resume upload
router.post('/submit', upload.single('resume'), submitContact);

// Admin routes (protected)
router.get('/submissions', protect, admin, getSubmissions);
router.get('/submission/:id', protect, admin, getSubmission);
router.put('/submission/:id/status', protect, admin, updateSubmissionStatus);
router.post('/submission/:id/reply', protect, admin, replyToSubmission);
router.delete('/submission/:id', protect, admin, deleteSubmission);

module.exports = router;
