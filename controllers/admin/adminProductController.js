// const userAuthenticated = require("../middleware/adminauthmildware");
require("dotenv").config();
const Product = require("../../models/productSchema");
const Variant = require("../../models/variantSchema");
const Category = require("../../models/categoryModel");
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
  try {
    const { productName, brand, gender, categoriesId, imageUrls } = req.body;

    if (!productName || !brand || !gender || !imageUrls) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newProduct = new Product({
      productName,
      brand,
      gender,
      categoriesId,
      imageUrl: imageUrls,
    });

    const savedProduct = await newProduct.save();

    // Send JSON response with productId
    res.status(200).json({
      message: "Product added successfully",
      productId: savedProduct._id,
    });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ error: "Error adding product" });
  }
};


// Update Product
exports.getProductDetails = async (req, res) => {
try {
  const productId = req.params.id;
  // console.log("Product ID:", productId);

  const product = await Product.findById(productId);
  if (!product) {
    console.log("Product not found");
    return res.status(404).json({ error: "Product not found" });
  }

  const variants = await Variant.find({ productId });
  // console.log("Product Details:", product);
  // console.log("Variants:", variants);

  res.status(200).json({
    product: {
      productName: product.productName,
      brand: product.brand,
      gender: product.gender,
      photos: product.imageUrl, 
    },
    variants: variants.map((variant) => ({
      _id: variant._id,
      color: variant.color,
      price: variant.price,
      discountPrice: variant.discountPrice,
      discountPercentage: variant.discountPercentage
    })),
  });
} catch (error) {
  console.error("Error fetching product details:", error);
  res.status(500).json({ error: "Failed to fetch product details" });
}
};


exports.updateProductDetails = async (req, res) => {
  try {
    const { productName, brand, gender, variants } = req.body;

    // console.log("Request Body:", req.body);

    if (!productName || !brand || !gender) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Update product details
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { productName, brand, gender },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update or create variants
    if (Array.isArray(variants)) {
      for (const variant of variants) {
        if (variant._id) {
          // Update existing variant
          await Variant.findByIdAndUpdate(
            variant._id,
            {
              color: variant.color,
              price: variant.price,
              discountPrice: variant.discountPrice,
              discountPercentage: variant.discountPercentage,
            },
            { new: true }
          );
        } else {
          // Create new variant
          await new Variant({
            ...variant,
            productId: req.params.id,
          }).save();
        }
      }
    }

    res
      .status(200)
      .json({ message: "Product and variants updated successfully" });
  } catch (err) {
    console.error("Error updating product details:", err.message, err.stack);
    res.status(500).json({ error: "Error updating product details" });
  }
};


exports.deleteProduct = async (req, res) => {
  try {
    // Find and delete the product
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    // If the product was deleted, also delete its variants
    if (deletedProduct) {
      await Variant.deleteMany({ productId: req.params.id });
    }

    res.redirect(
      "/admin/products?message=Product%20and%20its%20variants%20deleted%20successfully"
    );
  } catch (err) {
    console.error("Error deleting product and its variants:", err);
    res.status(500).send("Error deleting product and its variants");
  }
};







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
    } = req.body;

    // console.log(
    //   productId + " "
    //   + color + " " +
    //   price + " "+
    //   discountPrice + "  "+
    //   discountPercentage + " "+
    //   rating
    // );

    if (!productId || !color || !price ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newVariant = new Variant({
      productId,
      color,
      price,
      discountPrice,
      discountPercentage,
      rating,
    });

    await newVariant.save();
    res.redirect("/admin/products")
  } catch (err) {
    console.error("Error adding product variant:", err);
    res.status(500).json({ error: "Error adding product variant" });
  }
};
