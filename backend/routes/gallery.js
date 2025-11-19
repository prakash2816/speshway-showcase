const express = require('express');
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
} = require('../controllers/galleryControllerDynamo');

const { protect, admin } = require('../middleware/authMiddlewareDynamo');

// Public routes
router.get('/', getGalleryItems);
router.get('/item/:id', getGalleryItem);
router.get('/categories', getCategories);

// Admin protected routes
router.post('/create', protect, admin, upload.single('image'), createGalleryItem);
router.put('/update/:id', protect, admin, upload.single('image'), updateGalleryItem);
router.delete('/delete/:id', protect, admin, deleteGalleryItem);

router.get('/stats', protect, admin, getGalleryStats);

router.post('/category/create', protect, admin, createCategory);
router.delete('/category/:name', protect, admin, deleteCategory);

module.exports = router;
