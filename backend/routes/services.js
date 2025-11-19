const express = require('express');
const router = express.Router();

const {
  getServicesDynamo,
  getService,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceControllerDynamo');

const { protect, admin } = require('../middleware/authMiddlewareDynamo');

// Public Routes
router
  .route('/')
  .get(getServicesDynamo)
  .post(protect, admin, createService);

// Admin protected routes
router
  .route('/:id')
  .get(getService)
  .put(protect, admin, updateService)
  .delete(protect, admin, deleteService);

module.exports = router;
