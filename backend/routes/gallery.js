const express = require("express");
const router = express.Router();

const {
  upload,
  getGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getGalleryStats,
  getCategories,
  createCategory,
  deleteCategory
} = require("../controllers/galleryController");

// Auth Middleware
const { protect } = require("../middleware/authMiddleware");

// ------------------------------------------------------------
// GET ALL GALLERY ITEMS (Public)
// Route: GET /api/gallery
// Optional filters: ?category=&limit=&page=&sort=ASC|DESC
// ------------------------------------------------------------
router.get("/", getGalleryItems);

// ------------------------------------------------------------
// GET SINGLE GALLERY ITEM (Public)
// Route: GET /api/gallery/:id
// ------------------------------------------------------------
router.get("/:id", getGalleryItem);

// ------------------------------------------------------------
// CREATE GALLERY ITEM (Admin/HR Only)
// Route: POST /api/gallery
// Form-Data: image (file)
// ------------------------------------------------------------
router.post(
  "/",
  protect,
  upload.single("image"),
  createGalleryItem
);

// ------------------------------------------------------------
// UPDATE GALLERY ITEM (Admin/HR Only)
// Route: PUT /api/gallery/:id
// Optional new image in Form-Data
// ------------------------------------------------------------
router.put(
  "//:id",
  protect,
  upload.single("image"),
  updateGalleryItem
);

// ------------------------------------------------------------
// DELETE GALLERY ITEM (Admin/HR Only)
// Route: DELETE /api/gallery/:id
// ------------------------------------------------------------
router.delete(
  "//:id",
  protect,
  deleteGalleryItem
);

// ------------------------------------------------------------
// GALLERY STATS (Admin/HR Only)
// Route: GET /api/gallery-stats
// ------------------------------------------------------------
router.get("/stats/all", protect, getGalleryStats);

// ------------------------------------------------------------
// GET UNIQUE CATEGORIES (Public)
// Route: GET /api/gallery-categories
// ------------------------------------------------------------
router.get("/categories/all", getCategories);

// ------------------------------------------------------------
// CREATE CATEGORY (Admin/HR Only)
// Route: POST /api/gallery-categories
// Body: { name: "Category Name" }
// ------------------------------------------------------------
router.post("/categories", protect, createCategory);

// ------------------------------------------------------------
// DELETE CATEGORY (Admin/HR Only)
// Route: DELETE /api/gallery-categories/:name
// ------------------------------------------------------------
router.delete("/categories/:name", protect, deleteCategory);

module.exports = router;
