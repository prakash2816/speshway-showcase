const express = require('express');
const router = express.Router();

const {
  getServicesDynamo,
  getServiceDynamo,
  createServiceDynamo,
  updateServiceDynamo,
  deleteServiceDynamo
} = require('../controllers/serviceControllerDynamo');

const { protectDynamo, adminDynamo } = require('../middleware/authMiddlewareDynamo');

// Public Routes
router
  .route('/')
  .get(getServicesDynamo)
  .post(protectDynamo, adminDynamo, createServiceDynamo);

// Admin protected routes
router
  .route('/:id')
  .get(getServiceDynamo)
  .put(protectDynamo, adminDynamo, updateServiceDynamo)
  .delete(protectDynamo, adminDynamo, deleteServiceDynamo);

module.exports = router;
