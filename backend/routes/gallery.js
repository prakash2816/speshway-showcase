const express = require('express');
const router = express.Router();

const {
  getGalleryItemsDynamo,
  getGalleryItemDynamo,
  createGalleryItemDynamo,
  updateGalleryItemDynamo,
  deleteGalleryItemDynamo,
  getGalleryStatsDynamo,
  getCategoriesDynamo,
  createCategoryDynamo,
  deleteCategoryDynamo
} = require('../controllers/galleryControllerDynamo');

const { protectDynamo, adminDynamo } = require('../middleware/authMiddlewareDynamo');

const multer = require('multer');
const { createCloudinaryStorage } = require('../config/cloudinary');

// Multer for gallery images (no change needed)
const uploadGalleryImageDynamo = multer({
  storage: createCloudinaryStorage('speshway/gallery'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// Public routes
router.get('/', getGalleryItemsDynamo);
router.get('/stats', getGalleryStatsDynamo);
router.get('/categories', getCategoriesDynamo);
router.get('/:id', getGalleryItemDynamo);

// Admin routes (protected)
router.post('/categories', protectDynamo, adminDynamo, createCategoryDynamo);
router.delete('/categories/:name', protectDynamo, adminDynamo, deleteCategoryDynamo);

router.post(
  '/',
  protectDynamo,
  adminDynamo,
  uploadGalleryImageDynamo.single('image'),
  createGalleryItemDynamo
);

router.put(
  '/:id',
  protectDynamo,
  adminDynamo,
  uploadGalleryImageDynamo.single('image'),
  updateGalleryItemDynamo
);

router.delete('/:id', protectDynamo, adminDynamo, deleteGalleryItemDynamo);

module.exports = router;
