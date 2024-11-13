// const userAuthenticated = require("../middleware/adminauthmildware");
const Product = require("../../models/productSchema");


exports.getProducts = [
//   userAuthenticated,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const products = await Product.find().skip(skip).limit(limit);
      const totalProducts = await Product.countDocuments();
      const totalPages = Math.ceil(totalProducts / limit);

      res.render("admin/adminProduct", {
        message: req.query.message || undefined, // Fetch message from query parameters
        products,
        currentPage: page,
        totalPages,
      });
    } catch (err) {
      res.status(500).send("Error fetching products");
    }
  },
];


const Category = require("../../models/categoryModel"); 

exports.getAddProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("admin/adminAddProduct", {
      pageTitle: "Add Product",
      path: "/admin/products/add",
      categories: categories,
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Error fetching categories");
  }
};




exports.postAddProduct = async (req, res) => {
  const { productName, brand, gender, categoriesId } = req.body;

  const newProduct = new Product({
    productName,
    brand,
    gender,
    categoriesId
  });

  try {
    const savedProduct = await newProduct.save();
    res.redirect(`/admin/products/add/variant?productId=${savedProduct._id}`);
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).send("Error adding product");
  }
};




// Update Product
exports.updateProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, {
      productName: req.body.productName,
      brand: req.body.brand,
      gender: req.body.gender,
      categoriesId: req.body.categoriesId,
    });
    res.redirect('/admin/products?message=Product%20updated%20successfully');
  } catch (err) {
    res.status(500).send('Error updating product');
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/products?message=Product%20deleted%20successfully');
  } catch (err) {
    res.status(500).send('Error deleting product');
  }
};

const Variant = require("../../models/variantSchema"); // Adjust the path to your Variant model as needed


exports.getAddvariant = async (req, res) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).send("Product ID is required");
  }

  try {
    res.render("admin/adminAddvariant", {
      pageTitle: "Add Variant",
      path: "/admin/products/add/variant",
      productId
    });
  } catch (err) {
    console.error("Error rendering add variant form:", err);
    res.status(500).send("Error rendering add variant form");
  }
};


const fs = require("fs");
const multer = require("multer");
const path = require("path");

// Ensure 'uploads' folder exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Save files to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp to avoid filename conflicts
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Please upload an image file."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

// Use 'upload' middleware in your route handler
exports.postAddvariant = [
  upload.array("imageFile", 4), // Allow up to 4 images
  async (req, res) => {
    try {
      const {
        productId,
        color,
        price,
        discountPrice,
        discountPercentage,
        rating,
      } = req.body;
      const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);

      const newVariant = new Variant({
        productId,
        color,
        price,
        discountPrice,
        discountPercentage,
        rating,
        imageUrl: imageUrls,
      });

      await newVariant.save();
      res.redirect("/admin/products?message=Variant%20added%20successfully");
    } catch (err) {
      console.error("Error adding product variant:", err);
      res.status(500).send("Error adding product variant");
    }
  },
];
