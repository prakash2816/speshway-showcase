const express = require('express');
const router = express.Router();

const {
  getPortfoliosDynamo,
  getPortfolioDynamo,
  createPortfolioDynamo,
  updatePortfolioDynamo,
  deletePortfolioDynamo
} = require('../controllers/portfolioControllerDynamo');

const { protect, admin } = require('../middleware/authMiddlewareDynamo');

const { uploadPortfolioImageDynamo } = require('../config/cloudinaryDynamo');

// Routes
router
  .route('/')
  .get(getPortfoliosDynamo)
  .post(
    protect,
    admin,
    uploadPortfolioImageDynamo.single('image'),
    createPortfolioDynamo
  );

router
  .route('/:id')
  .get(getPortfolioDynamo)
  .put(
    protect,
    admin,
    uploadPortfolioImageDynamo.single('image'),
    updatePortfolioDynamo
  )
  .delete(protect, admin, deletePortfolioDynamo);

module.exports = router;
