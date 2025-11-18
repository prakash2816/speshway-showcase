const express = require('express');
const router = express.Router();

const {
  getClientsDynamo,
  getClientDynamo,
  createClientDynamo,
  updateClientDynamo,
  deleteClientDynamo
} = require('../controllers/clientControllerDynamo');

const {
  protectDynamo,
  optionalProtectDynamo,
  adminDynamo
} = require('../middleware/authMiddlewareDynamo');

router
  .route('/')
  .get(optionalProtectDynamo, getClientsDynamo)
  .post(protectDynamo, adminDynamo, createClientDynamo);

router
  .route('/:id')
  .get(getClientDynamo)
  .put(protectDynamo, adminDynamo, updateClientDynamo)
  .delete(protectDynamo, adminDynamo, deleteClientDynamo);

module.exports = router;
