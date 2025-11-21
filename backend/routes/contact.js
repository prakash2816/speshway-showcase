// backend/routes/clients.js

const express = require('express');
const router = express.Router();

const {
  getAllClients,
  getClientById,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord
} = require('../models/client'); // import from models

const {
  protect,
  optionalProtect,
  admin
} = require('../middleware/authMiddlewareDynamo');

// ------------------------
// CLIENTS ROUTES
// ------------------------

// GET all clients (optional auth)
router.get('/', optionalProtect, async (req, res) => {
  try {
    const clients = await getAllClients();
    res.json(clients);
  } catch (error) {
    console.error("Get all clients error:", error);
    res.status(500).json({ message: error.message });
  }
});

// CREATE client (admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const client = await createClientRecord(req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error("Create client error:", error);
    res.status(400).json({ message: error.message });
  }
});

// GET single client
router.get('/:id', async (req, res) => {
  try {
    const client = await getClientById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    console.error("Get client error:", error);
    res.status(500).json({ message: error.message });
  }
});

// UPDATE client (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const updated = await updateClientRecord(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Update client error:", error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE client (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const result = await deleteClientRecord(req.params.id);
    res.json(result);
  } catch (error) {
    console.error("Delete client error:", error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
