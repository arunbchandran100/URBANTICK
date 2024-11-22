const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Comprehensive list of supported image file types
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
];

const localStorage = multer.memoryStorage();
const uploadLocal = multer({
  storage: localStorage,
  fileFilter: (req, file, cb) => {
    // Extensive file type validation
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".tiff",
      ".tif",
    ];

    // Check both MIME type and file extension
    if (
      SUPPORTED_IMAGE_TYPES.includes(file.mimetype) &&
      allowedExtensions.includes(fileExtension)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type. Allowed types: ${allowedExtensions.join(
            ", "
          )}`
        ),
        false
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // Increased to 10MB
    files: 4, // Max 4 files
  },
});

const uploadMiddleware = async (req, res, next) => {
  try {
    uploadLocal.array("imageFiles")(req, res, async (multerErr) => {
      // Comprehensive error handling
      if (multerErr) {
        console.error("Multer Upload Error:", {
          message: multerErr.message,
          name: multerErr.name,
          stack: multerErr.stack,
        });

        return res.status(400).json({
          error: "File upload error",
          details: multerErr.message,
        });
      }

      // Validate file upload
      if (!req.files || req.files.length === 0) {
        console.error("No files uploaded");
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Detailed logging of uploaded files
      console.log(
        "Uploaded Files Details:",
        req.files.map((file) => ({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          encoding: file.encoding,
        }))
      );

      try {
        // Cloudinary upload with comprehensive error handling
        const uploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            // Advanced upload stream configuration
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "product_variants",
                // Support all common image formats
                allowed_formats: [
                  "jpg",
                  "jpeg",
                  "png",
                  "gif",
                  "webp",
                  "svg",
                  "bmp",
                  "tiff",
                ],
                resource_type: "image",
                transformation: [
                  { quality: "auto:best" },
                  { fetch_format: "auto" },
                ],
              },
              (error, result) => {
                if (error) {
                  console.error("Cloudinary Upload Error:", {
                    message: error.message,
                    error: error,
                    file: file.originalname,
                  });
                  reject(error);
                } else {
                  console.log("Cloudinary Upload Success:", {
                    url: result.secure_url,
                    filename: file.originalname,
                  });
                  resolve(result.secure_url);
                }
              }
            );

            // Convert buffer to stream
            const bufferStream = require("stream").Readable.from(file.buffer);
            bufferStream.pipe(uploadStream);
          });
        });

        // Upload all images
        const imageUrls = await Promise.all(uploadPromises);

        // Attach URLs to request body
        req.body.imageUrls = imageUrls;

        // Proceed to next middleware
        next();
      } catch (cloudinaryError) {
        console.error("Comprehensive Cloudinary Error:", {
          message: cloudinaryError.message,
          stack: cloudinaryError.stack,
        });

        return res.status(500).json({
          error: "Error uploading to cloud storage",
          details: cloudinaryError.message,
        });
      }
    });
  } catch (generalError) {
    console.error("General Middleware Error:", {
      message: generalError.message,
      stack: generalError.stack,
    });

    return res.status(500).json({
      error: "Server error during upload",
      details: generalError.message,
    });
  }
};

// Function to validate Cloudinary configuration
function validateCloudinaryConfig() {
  const requiredEnvVars = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("Missing Cloudinary Configuration:", missingVars);
    throw new Error(
      `Missing Cloudinary configuration: ${missingVars.join(", ")}`
    );
  }
}

// Validate config on module load
validateCloudinaryConfig();

module.exports = uploadMiddleware;
