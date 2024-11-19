const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//local storage first for handling the cropped images
const localStorage = multer.memoryStorage();
const uploadLocal = multer({
  storage: localStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 4, // Max 4 files
  },
});

// Middleware to handle the file upload and Cloudinary upload
const uploadMiddleware = async (req, res, next) => {
  try {
    uploadLocal.array("imageFiles")(req, res, async (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ error: "File upload error" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      try {
        const uploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "product_variants",
                allowed_formats: ["jpg", "jpeg", "png"],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            );

            const bufferStream = require("stream").Readable.from(file.buffer);
            bufferStream.pipe(uploadStream);
          });
        });

        const imageUrls = await Promise.all(uploadPromises);

        req.body.imageUrls = imageUrls;

        next();
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        return res
          .status(500)
          .json({ error: "Error uploading to cloud storage" });
      }
    });
  } catch (error) {
    console.error("General error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = uploadMiddleware;
