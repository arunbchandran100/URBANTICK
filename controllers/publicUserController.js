// const collection = require("../models/mongodb");


// ///////////////////Home page/////////////////////
// exports.home = (req, res) => {

//     res.render('publicUser/home')
// };

const Product = require("../models/productSchema"); // Assuming Product is your model
const Variant = require("../models/variantSchema"); // Variant model

exports.home = async (req, res) => {
  try {
    // Use aggregation to fetch products and their corresponding variant details
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "variants", // Collection name for the Variant model
          localField: "_id",
          foreignField: "productId",
          as: "variants",
        },
      },
      {
        $project: {
          productName: 1,
          imageUrl: 1,
          variants: {
            $arrayElemAt: ["$variants", 0], // Get the first variant (you can adjust as needed)
          },
        },
      },
    ]);

    // Format products for rendering
    const formattedProducts = products.map((product) => ({
      productName: product.productName,
      imageUrl:
        Array.isArray(product.imageUrl) && product.imageUrl.length > 0
          ? product.imageUrl[0]
          : "/images/default-product.jpg",
      price: product.variants?.price || null,
      discountPrice: product.variants?.discountPrice || null,
    }));

    console.log(formattedProducts);
    res.render("publicUser/home", { products: formattedProducts });
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).send("Server Error");
  }
};
