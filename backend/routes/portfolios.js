const express = require("express");
const router = express.Router();

// Controllers
const {
  getPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio
} = require("../controllers/portfoliosController");

// Auth Middleware (Admin / HR for write operations)
const { protect } = require("../middleware/authMiddleware");

// Multer Upload (Cloudinary Storage)
const upload = require('../middleware/multerCloudinary');

// ------------------------------------------------------------
// GET ALL PORTFOLIOS (Public)
// Route: GET /api/portfolios
// ------------------------------------------------------------
router.get("/", getPortfolios);

// ------------------------------------------------------------
// GET SINGLE PORTFOLIO (Public)
// Route: GET /api/portfolios/:id
// ------------------------------------------------------------
router.get("/:id", getPortfolio);

// ------------------------------------------------------------
// CREATE PORTFOLIO (Protected: Admin / HR)
// Route: POST /api/portfolios
// Form-Data: image (file)
// ------------------------------------------------------------
router.post(
  "/",
  protect,
  upload.single("image"),
  createPortfolio
);

// ------------------------------------------------------------
// UPDATE PORTFOLIO (Protected: Admin / HR)
// Route: PUT /api/portfolios/:id
// Optional new image in Form-Data
// ------------------------------------------------------------
router.put(
  "/:id",
  protect,
  upload.single("image"),
  updatePortfolio
);

// ------------------------------------------------------------
// DELETE PORTFOLIO (Protected: Admin / HR)
// Route: DELETE /api/portfolios/:id
// ------------------------------------------------------------
router.delete(
  "/:id",
  protect,
  deletePortfolio
);

module.exports = router;
