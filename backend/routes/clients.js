const express = require('express');
const router = express.Router();

const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
} = require('../controllers/clientControllerDynamo');

const {
  protect,
  optionalProtectDynamo,
  adminDynamo
} = require('../middleware/authMiddlewareDynamo');

router
  .route('/')
  .get(optionalProtectDynamo, getClients)
  .post(protect, admin, createClient);

router
  .route('/:id')
  .get(getClient)
  .put(protect, admin, updateClient)
  .delete(protect, admin, deleteClient);

module.exports = router;
