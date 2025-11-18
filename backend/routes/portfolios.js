const express = require('express');
const router = express.Router();

const {
  getPortfoliosDynamo,
  getPortfolioDynamo,
  createPortfolioDynamo,
  updatePortfolioDynamo,
  deletePortfolioDynamo
} = require('../controllers/portfolioControllerDynamo');

const { protectDynamo, adminDynamo } = require('../middleware/authMiddlewareDynamo');

const { uploadPortfolioImageDynamo } = require('../config/cloudinaryDynamo');

// Routes
router
  .route('/')
  .get(getPortfoliosDynamo)
  .post(
    protectDynamo,
    adminDynamo,
    uploadPortfolioImageDynamo.single('image'),
    createPortfolioDynamo
  );

router
  .route('/:id')
  .get(getPortfolioDynamo)
  .put(
    protectDynamo,
    adminDynamo,
    uploadPortfolioImageDynamo.single('image'),
    updatePortfolioDynamo
  )
  .delete(protectDynamo, adminDynamo, deletePortfolioDynamo);

module.exports = router;
