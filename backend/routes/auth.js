const express = require('express');
const router = express.Router();

const {
  registerUserDynamo,
  authUserDynamo,
  getMeDynamo
} = require('../controllers/authControllerDynamo');

const { protectDynamo } = require('../middleware/authMiddlewareDynamo');

// Register User (DynamoDB)
router.post('/register', registerUserDynamo);

// Login User (DynamoDB)
router.post('/login', authUserDynamo);

// Get Current User (DynamoDB)
router.get('/me', protectDynamo, getMeDynamo);

module.exports = router;
