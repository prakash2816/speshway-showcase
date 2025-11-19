const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Custom storage for Cloudinary
const createCloudinaryStorage = (folder) => {
  return {
    _handleFile: async (req, file, cb) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: folder === 'speshway/portfolios'
            ? [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }]
            : [{ width: 500, height: 500, crop: 'fill', gravity: 'face', quality: 'auto' }],
        },
        (error, result) => {
          if (error) {
            return cb(error);
          }
          cb(null, {
            path: result.secure_url,
            filename: result.public_id,
            size: result.bytes,
          });
        }
      );

      file.stream.pipe(stream);
    },
    _removeFile: (req, file, cb) => {
      cb(null);
    },
  };
};

// Create multer upload instances
const uploadPortfolioImageDynamo = multer({
  storage: createCloudinaryStorage('speshway/portfolios'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const uploadTeamImage = multer({
  storage: createCloudinaryStorage('speshway/team'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Gallery image upload configuration
const uploadGalleryImage = multer({
  storage: createCloudinaryStorage('speshway/gallery'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

module.exports = {
  cloudinary,
  createCloudinaryStorage,
  uploadPortfolioImageDynamo,
  uploadTeamImage,
  uploadGalleryImage,
};
