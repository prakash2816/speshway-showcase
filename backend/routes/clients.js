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
  optionalProtect,
  admin
} = require('../middleware/authMiddlewareDynamo');

router
  .route('/')
  .get(optionalProtect, getClients)
  .post(protect, admin, createClient);

router
  .route('/:id')
  .get(getClient)
  .put(protect, admin, updateClient)
  .delete(protect, admin, deleteClient);

module.exports = router;
