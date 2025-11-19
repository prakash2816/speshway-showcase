const express = require('express');
const router = express.Router();

const {
  getPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio
} = require('../controllers/portfolioControllerDynamo');

const { protect, admin } = require('../middleware/authMiddlewareDynamo');

const { uploadPortfolioImageDynamo } = require('../config/cloudinaryDynamo');

// Routes
router
  .route('/')
  .get(getPortfolios)
  .post(
    protect,
    admin,
    uploadPortfolioImageDynamo.single('image'),
    createPortfolio
  );

router
  .route('/:id')
  .get(getPortfolio)
  .put(
    protect,
    admin,
    uploadPortfolioImageDynamo.single('image'),
    updatePortfolio
  )
  .delete(protect, admin, deletePortfolio);

module.exports = router;
