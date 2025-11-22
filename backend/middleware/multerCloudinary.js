const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryDynamo");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "portfolios",
  },
});

const upload = multer({ storage });

module.exports = upload;
