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
                    brand: 1,
                    productName: 1,
                    imageUrl: 1,
                    "variants.color": 1,
                    "variants.price": 1,
                    "variants.rating": 1,
                    "variants.discountPrice": 1,
                    "variants.discountPercentage": 1,
                },
            },
        ]);

        const formattedProducts = products.map((product) => ({
            _id: product._id,
            brand: product.brand,
            productName: product.productName,
            imageUrl:
                Array.isArray(product.imageUrl) && product.imageUrl.length > 0
                    ? product.imageUrl[0]
                    : "/images/default-product.jpg",
            price: product.variants?.price || null,
            rating: product.variants?.rating || null,
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

//-------------------- Filtering---------
exports.filterProducts = async (req, res) => {
    try {
        const { gender, brand, color, minPrice, maxPrice } = req.query;
        const matchCriteria = {};

        // Add price range criteria
        if (minPrice || maxPrice) {
            matchCriteria["variants.discountPrice"] = {};
            if (minPrice) {
                matchCriteria["variants.discountPrice"].$gte = parseFloat(minPrice);
            }
            if (maxPrice) {
                matchCriteria["variants.discountPrice"].$lte = parseFloat(maxPrice);
            }
        }

        // Add gender criteria
        if (gender) {
            matchCriteria.gender = gender; // Assuming `gender` is a field in your product model
        }

        // Add brand criteria
        if (brand) {
            matchCriteria.brand = brand; // Assuming `brand` is a field in your product model
        }

        // Add color criteria
        if (color) {
            matchCriteria["variants.color"] = color;
        }

        console.log("Match criteria:", matchCriteria);

        // Aggregate query to fetch filtered products
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
                $match: matchCriteria,
            },
            {
                $project: {
                    _id: 1,
                    brand: 1,
                    productName: 1,
                    imageUrl: 1,
                    "variants.color": 1,
                    "variants.rating": 1,
                    "variants.price": 1,
                    "variants.discountPrice": 1,
                    "variants.discountPercentage": 1,
                },
            },
        ]);

        const formattedProducts = products.map((product) => ({
            _id: product._id,
            brand: product.brand,
            productName: product.productName,
            imageUrl:
                Array.isArray(product.imageUrl) && product.imageUrl.length > 0
                    ? product.imageUrl[0]
                    : "/images/default-product.jpg",
            price: product.variants?.price || null,
            rating: product.variants?.rating || null,
            discountPrice: product.variants?.discountPrice || null,
            discountPercentage: product.variants?.discountPercentage || null,
        }));

        console.log("Filtered products:", formattedProducts);
        res.status(200).json({ products: formattedProducts });
    } catch (error) {
        console.error("Error filtering products:", error);
        res.status(500).json({ error: "Failed to filter products" });
    }
};

exports.getFilterOptions = async (req, res) => {
    try {
        const brands = await Product.distinct("brand"); // Assuming `brand` exists in the product model
        const colors = await Product.aggregate([
            {
                $lookup: {
                    from: "variants",
                    localField: "_id",
                    foreignField: "productId",
                    as: "variants",
                },
            },
            {
                $unwind: "$variants",
            },
            {
                $group: {
                    _id: null,
                    uniqueColors: { $addToSet: "$variants.color" },
                },
            },
            {
                $project: {
                    _id: 0,
                    uniqueColors: 1,
                },
            },
        ]);

        res.status(200).json({ brands, colors: colors[0]?.uniqueColors || [] });
    } catch (error) {
        console.error("Error fetching filter options:", error);
        res.status(500).json({ error: "Failed to fetch filter options" });
    }
};
