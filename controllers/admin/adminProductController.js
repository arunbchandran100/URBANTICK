// const userAuthenticated = require("../middleware/adminauthmildware");
const Product = require("../../models/productSchema");
require("dotenv").config();

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
        message: req.query.message || undefined,  
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

  try {

  const newProduct = new Product({
    productName,
    brand,
    gender,
    categoriesId,
  });

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
    res.redirect("/admin/products?message=Product%20updated%20successfully");
  } catch (err) {
    res.status(500).send("Error updating product");
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products?message=Product%20deleted%20successfully");
  } catch (err) {
    res.status(500).send("Error deleting product");
  }
};

const Variant = require("../../models/variantSchema");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "product_variants",  
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage: storage });

// Route Handlers
exports.getAddvariant = async (req, res) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).send("Product ID is required");
  }

  try {
    res.render("admin/adminAddvariant", {
      pageTitle: "Add Variant",
      path: "/admin/products/add/variant",
      productId,
    });
  } catch (err) {
    console.error("Error rendering add variant form:", err);
    res.status(500).send("Error rendering add variant form");
  }
};


exports.postAddvariant = async (req, res) => {
  try {
    const {
      productId,
      color,
      price,
      discountPrice,
      discountPercentage,
      rating,
      imageUrls, 
    } = req.body;


    if (!productId || !color || !price || !imageUrls) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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
    res.status(200).json({ message: "Variant added successfully" });
  } catch (err) {
    console.error("Error adding product variant:", err);
    res.status(500).json({ error: "Error adding product variant" });
  }
};
