const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage Factory
const createCloudinaryStorage = (folder) => {
  return {
    _handleFile: async (req, file, cb) => {
      try {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            transformation:
              folder === "speshway/portfolios"
                ? [{ width: 1200, height: 800, crop: "limit", quality: "auto" }]
                : [{ width: 500, height: 500, crop: "fill", gravity: "face", quality: "auto" }],
          },
          (error, result) => {
            if (error) return cb(error);

            cb(null, {
              path: result.secure_url,
              filename: result.public_id,
              size: result.bytes,
            });
          }
        );

        file.stream.pipe(uploadStream);
      } catch (err) {
        cb(err);
      }
    },
    _removeFile(req, file, cb) {
      cb(null);
    },
  };
};

// Portfolio Upload
const uploadPortfolioImageDynamo = multer({
  storage: createCloudinaryStorage("speshway/portfolios"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

// Team Upload
const uploadTeamImage = multer({
  storage: createCloudinaryStorage("speshway/team"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

// Gallery Upload
const uploadGalleryImage = multer({
  storage: createCloudinaryStorage("speshway/gallery"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

module.exports = {
  cloudinary,
  createCloudinaryStorage,
  uploadPortfolioImageDynamo,
  uploadTeamImage,
  uploadGalleryImage,
};
