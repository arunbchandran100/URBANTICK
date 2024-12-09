const adminAuthenticated = require("../../middleware/adminauthmildware");
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
    adminAuthenticated,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      // Populate the category field
      const products = await Product.find()
        .populate("categoriesId") // Populate category details
        .skip(skip)
        .limit(limit)
        .lean(); // Use .lean() for faster queries and to convert Mongoose documents to plain JavaScript objects
      const totalProducts = await Product.countDocuments();
      const totalPages = Math.ceil(totalProducts / limit);

      //console.log(products)
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

exports.getAddProduct = [
  adminAuthenticated,
  async (req, res) => 
  {
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
  }
]

exports.postAddProduct = async (req, res) => {
  try {
    let { productName, brand, gender, categoriesId, imageUrls } = req.body;

    brand = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();

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

    res.status(200).json({
      message: "Product added successfully",
      productId: savedProduct._id,
    });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ error: "Error adding product" });
  }
};

//---------------GET Update Product----------------------
exports.getProductDetails = [
  adminAuthenticated,
  async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      console.log("Product not found");
      return res.status(404).json({ error: "Product not found" });
    }

    const variants = await Variant.find({ productId });

    const categories = await Category.find();

    const productCategory = await Category.findOne(
      { _id: product.categoriesId },
      { categoriesName: 1 }
    );
    // console.log(productCategory);
    //categories: categories,
    // console.log(product.categoriesId);
    res.status(200).json({
      product: {
        productName: product.productName,
        brand: product.brand,
        gender: product.gender,
        photos: product.imageUrl,
        categoryName: productCategory ? productCategory.categoriesName : null,
      },
      variants: variants.map((variant) => ({
        _id: variant._id,
        color: variant.color,
        price: variant.price,
        rating: variant.rating,
        discountPrice: variant.discountPrice,
        discountPercentage: variant.discountPercentage,
        stock: variant.stock,
      })),
      categories,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
},
];

//---------------GET Update Product Image----------------------
exports.getEditProductImage = [
  adminAuthenticated,
  async (req, res) =>{
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      console.log("Product not found");
      return res.status(404).json({ error: "Product not found" });
    }


    //console.log(product);
    res.render("admin/adminEditImage",product)
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
},
]



//---------------POST Update Product Image----------------------

exports.postEditProductImage = async (req, res) => {
  try {
    //console.log("Request Body:", req.body);
   // console.log("Request Files:", req.files);

    const productId = req.params.id;
    const { imageIndex } = req.body;

    // Validate input with more detailed logging
    if (!productId) {
      console.error("Missing Product ID");
      return res.status(400).json({ error: "Missing product ID" });
    }

    if (imageIndex === undefined) {
      console.error("Missing Image Index");
      return res.status(400).json({ error: "Missing image index" });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      console.error(`Product not found with ID: ${productId}`);
      return res.status(404).json({ error: "Product not found" });
    }

    // Check uploaded image URLs
    if (!req.body.imageUrls || req.body.imageUrls.length === 0) {
      console.error("No image URLs provided");
      return res.status(400).json({
        error: "No new image uploaded",
        details: {
          bodyImageUrls: req.body.imageUrls,
          filesExist: !!req.files,
          fileCount: req.files ? req.files.length : 0,
        },
      });
    }

    const newImageUrl = req.body.imageUrls[0];
    //console.log("New Image URL:", newImageUrl);

    // Update image URL logic remains the same
    product.imageUrl[imageIndex] = newImageUrl;
    const updatedProduct = await product.save();

res.status(200).json({
  message: "Product image updated successfully",
  redirectUrl: "/admin/products", // Include redirect URL
});

  } catch (error) {
    console.error("Comprehensive Error in Image Update:", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: "Failed to update product image",
      details: error.message,
    });
  }
};

// Utility function to extract public ID from Cloudinary URL
function extractPublicIdFromUrl(url) {
  // Extract the public ID from a Cloudinary URL
  // Assumes Cloudinary URL format: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[folder]/[public_id].[format]
  const matches = url.match(/\/v\d+\/([^/]+)\.[^/.]+$/);
  return matches ? matches[1] : null;
}





//---------------POST Update Product----------------------
exports.updateProductDetails = async (req, res) => {
  try {
    let {
      productName,
      brand,
      gender,
      variants,
      categoriesId,
      imageUrls,
      stock,
    } = req.body;

    //const lowerCategoryName = brand.trim().toLowerCase();
    brand = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();


    if (!productName || !brand || !gender || !categoriesId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { productName, brand, gender, categoriesId, imageUrls },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (Array.isArray(variants)) {
      for (const variant of variants) {
        if (variant._id) {
          await Variant.findByIdAndUpdate(
            variant._id,
            {
              color: variant.color.charAt(0).toUpperCase() + variant.color.slice(1).toLowerCase(),
              price: variant.price,
              discountPrice: variant.discountPrice,
              discountPercentage: variant.discountPercentage,
              rating: variant.rating,
              stock: variant.stock,
            },
            { new: true }
          );
        } else {
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
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

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
    let {
      productId,
      color,
      price,
      discountPrice,
      discountPercentage,
      rating,
      stock,
    } = req.body;

    color = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();


    // console.log(
    //   productId + " "
    //   + color + " " +
    //   price + " "+
    //   discountPrice + "  "+
    //   discountPercentage + " "+
    //   rating
    // );

    if (!productId || !color || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newVariant = new Variant({
      productId,
      color,
      price,
      discountPrice,
      discountPercentage,
      rating,
      stock,
    });

    await newVariant.save();
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error adding product variant:", err);
    res.status(500).json({ error: "Error adding product variant" });
  }
};
