const Product = require("../../models/productSchema");
const Category = require("../../models/categoryModel");
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
        const { gender, brand, color, minPrice, maxPrice, category } = req.query;
        const matchCriteria = {};

        if (minPrice || maxPrice) {
            matchCriteria["variants.discountPrice"] = {};
            if (minPrice) {
                matchCriteria["variants.discountPrice"].$gte = parseFloat(minPrice);
            }
            if (maxPrice) {
                matchCriteria["variants.discountPrice"].$lte = parseFloat(maxPrice);
            }
        }

        if (gender) {
            matchCriteria.gender = gender; 
        }

        if (brand) {
            matchCriteria.brand = brand;
        }

        if (color) {
            matchCriteria["variants.color"] = color;
        }

        if (category) {
            matchCriteria.categoriesId = new mongoose.Types.ObjectId(category);
        }

        console.log("Match criteria:", matchCriteria);


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
                    categoriesId: 1,  
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
            categoryId: product.categoriesId,  
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
        const brands = await Product.distinct("brand");
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

        const categories = await Category.find({}, { _id: 1, categoriesName: 1 });

        // console.log(categories);
        res.status(200).json({
            brands,
            colors: colors[0]?.uniqueColors || [],
            categories, // Send all available categories
        });
    } catch (error) {
        console.error("Error fetching filter options:", error);
        res.status(500).json({ error: "Failed to fetch filter options" });
    }
};
