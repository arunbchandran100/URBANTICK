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
