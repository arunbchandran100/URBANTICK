
const Product = require("../models/productSchema"); 
const Variant = require("../models/variantSchema"); 
const mongoose = require("mongoose"); // Import mongoose


exports.home = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "variants",
          localField: "_id",
          foreignField: "productId",
          as: "variants",
        },
      },
      {
        $project: {
          _id: 1,
          productName: 1,
          imageUrl: 1,
          variants: {
            $arrayElemAt: ["$variants", 0],
          },
        },
      },
    ]);


    const formattedProducts = products.map((product) => ({
      _id: product._id,
      productName: product.productName,
      imageUrl:
        Array.isArray(product.imageUrl) && product.imageUrl.length > 0
          ? product.imageUrl[0]
          : "/images/default-product.jpg",
      price: product.variants?.price || null,
      discountPrice: product.variants?.discountPrice || null,
    }));

    // console.log(formattedProducts);
    res.render("publicUser/home", { products: formattedProducts });
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).send("Server Error");
  }
};


exports.shopAll = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "variants", 
          localField: "_id",
          foreignField: "productId",
          as: "variants",
        },
      },
      {
        $unwind: {
          path: "$variants",
          preserveNullAndEmptyArrays: true,  
        },
      },
      {
        $project: {
          _id:1,
          productName: 1,
          imageUrl: 1,
          "variants.color": 1,
          "variants.price": 1,
          "variants.discountPrice": 1,
          "variants.discountPercentage": 1,
        },
      },
    ]);


    const formattedProducts = products.map((product) => ({
      _id: product._id,
      productName: product.productName,
      imageUrl:
        Array.isArray(product.imageUrl) && product.imageUrl.length > 0
          ? product.imageUrl[0]
          : "/images/default-product.jpg",
      price: product.variants?.price || null,
      discountPrice: product.variants?.discountPrice || null,
      discountPercentage: product.variants?.discountPercentage || null,
    }));

    console.log(formattedProducts);
    res.render("publicUser/shopAll", { products: formattedProducts });
  } catch (err) {
    console.error("Error fetching products for Shop All page:", err.message);
    res.status(500).send("Server Error");
  }
};





exports.viewProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).send("Invalid Product ID");
    }

    const product = await Product.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(productId) } },
      {
        $lookup: {
          from: "variants",
          localField: "_id",
          foreignField: "productId",
          as: "variants",
        },
      },
      {
        $project: {
          productName: 1,
          imageUrl: 1,
          gender: 1,
          brand: 1,
          "variants.price": 1,
          "variants.discountPrice": 1,
          "variants.discountPercentage": 1,
          "variants.rating": 1,
          "variants.color": 1,
        },
      },
    ]);

    if (!product || product.length === 0) {
      return res.status(404).send("Product not found");
    }

    // Format product data
    const formattedProduct = {
      productName: product[0].productName,
      imageUrl: product[0].imageUrl,
      gender: product[0].gender,
      brand: product[0].brand,
      variants: product[0].variants.map((variant) => ({
        price: variant.price || "N/A",
        discountPrice: variant.discountPrice || "N/A",
        discountPercentage: variant.discountPercentage || "N/A",
        rating: variant.rating || "No rating",
        color: variant.color || "Unknown",
      })),
    };

    res.render("publicUser/viewProduct", { product: formattedProduct });
  } catch (err) {
    console.error("Error fetching product:", err.message);
    res.status(500).send("Server Error");
  }
};
