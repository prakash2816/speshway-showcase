const express = require('express');
const router = express.Router();

const { 
  uploadDynamo, 
  submitContactDynamo, 
  getSubmissionsDynamo 
} = require('../controllers/contactControllerDynamo');

const {
  protect,
  admin
} = require('../middleware/authMiddlewareDynamo');

// Public route: submit contact form with optional resume upload
router.post('/submit', uploadDynamo.single('resume'), submitContactDynamo);

// Admin route (protected) to get all submissions
router.get('/submissions', protect, admin, getSubmissionsDynamo);

module.exports = router;
