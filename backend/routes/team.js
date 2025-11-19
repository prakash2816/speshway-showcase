const express = require('express');
const router = express.Router();

const {
  getTeamMembersDynamo,
  getTeamMemberDynamo,
  createTeamMemberDynamo,
  updateTeamMemberDynamo,
  deleteTeamMemberDynamo
} = require('../controllers/teamControllerDynamo');

const { protect, admin } = require('../middleware/authMiddlewareDynamo');
const { uploadTeamImage } = require('../config/cloudinaryDynamo');

// Public Route
router
  .route('/')
  .get(getTeamMembersDynamo)
  .post(protect, admin, uploadTeamImage.single('image'), createTeamMemberDynamo);

// Admin Routes
router
  .route('/:id')
  .get(getTeamMemberDynamo)
  .put(protect, admin, uploadTeamImage.single('image'), updateTeamMemberDynamo)
  .delete(protect, admin, deleteTeamMemberDynamo);

module.exports = router;
