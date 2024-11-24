const Product = require("../../models/productSchema");
const Variant = require("../../models/variantSchema");
const mongoose = require("mongoose"); // Import mongoose

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
          _id: 1,
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

    // console.log(formattedProducts);
    res.render("user/shopAll", { products: formattedProducts });
  } catch (err) {
    console.error("Error fetching products for Shop All page:", err.message);
    res.status(500).send("Server Error");
  }
};

exports.filterProductsByPrice = async (req, res) => {
  try {
    const maxPrice = parseInt(req.query.maxPrice, 10);

    // Aggregate to join products and variants, then filter by maxPrice
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "variants", // Name of the variants collection
          localField: "_id", // Field in the products collection
          foreignField: "productId", // Field in the variants collection
          as: "variants", // Name of the joined array
        },
      },
      {
        $unwind: {
          path: "$variants", // Unwind the variants array
          preserveNullAndEmptyArrays: true, // Keep products even if they have no variants
        },
      },
      {
        $match: {
          "variants.discountPrice": { $lte: maxPrice }, // Filter by discountPrice
        },
      },
      {
        $project: {
          _id: 1,
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
    // Send the filtered products as JSON
    res.status(200).json({ products: formattedProducts  });
  } catch (error) {
    console.error("Error filtering products:", error);
    res.status(500).json({ error: "Failed to filter products" });
  }
};
