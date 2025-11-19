const express = require('express');
const router = express.Router();

const {
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
} = require('../controllers/teamControllerDynamo');

const { protect, admin } = require('../middleware/authMiddlewareDynamo');
const { uploadTeamImage } = require('../config/cloudinaryDynamo');

// Public Routes
router
  .route('/')
  .get(getTeamMembers)
  .post(protect, admin, uploadTeamImage.single('image'), createTeamMember);

// Admin Routes
router
  .route('/:id')
  .get(getTeamMember)
  .put(protect, admin, uploadTeamImage.single('image'), updateTeamMember)
  .delete(protect, admin, deleteTeamMember);

module.exports = router;
