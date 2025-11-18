const express = require('express');
const router = express.Router();

const {
  getTeamMembersDynamo,
  getTeamMemberDynamo,
  createTeamMemberDynamo,
  updateTeamMemberDynamo,
  deleteTeamMemberDynamo
} = require('../controllers/teamControllerDynamo');

const { protectDynamo, adminDynamo } = require('../middleware/authMiddlewareDynamo');
const { uploadTeamImage } = require('../config/cloudinary');

// Public Route
router
  .route('/')
  .get(getTeamMembersDynamo)
  .post(protectDynamo, adminDynamo, uploadTeamImage.single('image'), createTeamMemberDynamo);

// Admin Routes
router
  .route('/:id')
  .get(getTeamMemberDynamo)
  .put(protectDynamo, adminDynamo, uploadTeamImage.single('image'), updateTeamMemberDynamo)
  .delete(protectDynamo, adminDynamo, deleteTeamMemberDynamo);

module.exports = router;
