const express = require("express");
const router = express.Router();

const {
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

// Cloudinary Upload Middleware
const { uploadGalleryImage } = require("../config/cloudinaryDynamo");

router.get("/", getGalleryItems);

router.get("/:id", getGalleryItem);

router.post(
  "/",
  protect,
  uploadGalleryImage.single("image"),
  createGalleryItem
);

router.put(
  "/:id",
  protect,
  uploadGalleryImage.single("image"),
  updateGalleryItem
);

router.delete(
  "/:id",
  protect,
  deleteGalleryItem
);

router.get("/stats/all", protect, getGalleryStats);

router.get("/categories/all", getCategories);

router.post("/categories", protect, createCategory);

router.delete("/categories/:name", protect, deleteCategory);

module.exports = router;
