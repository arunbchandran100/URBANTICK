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
                    "variants._id": 1,
                    "variants.color": 1,
                    "variants.price": 1,
                    "variants.rating": 1,
                    "variants.discountPrice": 1,
                    "variants.discountPercentage": 1,
                    "variants.stock": 1,
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
            variants_id: product.variants?._id,
            color: product.variants?.color,
            price: product.variants?.price || null,
            rating: product.variants?.rating || null,
            discountPrice: product.variants?.discountPrice || null,
            discountPercentage: product.variants?.discountPercentage || null,
            stock: product.variants.stock,
        }));

        // console.log(formattedProducts);
        res.render("user/shopAll", { products: formattedProducts });
    } catch (err) {
        console.error("Error fetching products for Shop All page:", err.message);
        res.status(500).send("Server Error");
    }
};

//-------------------- Filtering---------
// exports.filterProducts = async (req, res) => {
//     try {
//         // console.log(222222);
//         const {
//             gender,
//             brand,
//             color,
//             minPrice,
//             maxPrice,
//             category,
//             stockStatus,
//             sort,
//         } = req.query;
//         const matchCriteria = {};

//         if (minPrice || maxPrice) {
//             matchCriteria["variants.discountPrice"] = {};
//             if (minPrice) {
//                 matchCriteria["variants.discountPrice"].$gte = parseFloat(minPrice);
//             }
//             if (maxPrice) {
//                 matchCriteria["variants.discountPrice"].$lte = parseFloat(maxPrice);
//             }
//         }

//         if (gender) {
//             matchCriteria.gender = gender;
//         }

//         if (brand) {
//             matchCriteria.brand = brand;
//         }

//         if (color) {
//             matchCriteria["variants.color"] = color;
//         }

//         if (category) {
//             matchCriteria.categoriesId = new mongoose.Types.ObjectId(category);
//         }

//         if (stockStatus) {
//             matchCriteria["variants.stock"] = {};
//             if (stockStatus === "inStock") {
//                 matchCriteria["variants.stock"].$gt = 0;
//             } else if (stockStatus === "outOfStock") {
//                 matchCriteria["variants.stock"].$lte = 0;
//             }
//         }

//         // console.log(2222);
//         // console.log(sort);
//         // Determine sorting order
//         let sortCriteria = {};
//         if (sort === "priceLowToHigh") {
//             sortCriteria = { "variants.discountPrice": 1 };
//         } else if (sort === "priceHighToLow") {
//             sortCriteria = { "variants.discountPrice": -1 };
//         } else if (sort === "ratingHighToLow") {
//             sortCriteria = { "variants.rating": -1 }; // Assuming a 'rating' field exists
//         } else if (sort === "newArrivals") {
//             sortCriteria = { createdAt: -1 };
//         }

//         const products = await Product.aggregate([
//             {
//                 $lookup: {
//                     from: "variants",
//                     localField: "_id",
//                     foreignField: "productId",
//                     as: "variants",
//                 },
//             },
//             {
//                 $unwind: {
//                     path: "$variants",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $match: matchCriteria,
//             },
//             ...(Object.keys(sortCriteria).length > 0
//                 ? [{ $sort: sortCriteria }]
//                 : []),
//             {
//                 $project: {
//                     _id: 1,
//                     brand: 1,
//                     productName: 1,
//                     imageUrl: 1,
//                     "variants.color": 1,
//                     "variants.rating": 1,
//                     "variants.price": 1,
//                     "variants.discountPrice": 1,
//                     "variants.discountPercentage": 1,
//                     "variants.stock": 1,
//                     categoriesId: 1,
//                 },
//             },
//         ]);

//         const formattedProducts = products.map((product) => ({
//             _id: product._id,
//             brand: product.brand,
//             productName: product.productName,
//             imageUrl:
//                 Array.isArray(product.imageUrl) && product.imageUrl.length > 0
//                     ? product.imageUrl[0]
//                     : "/images/default-product.jpg",
//             price: product.variants?.price || null,
//             rating: product.variants?.rating || null,
//             discountPrice: product.variants?.discountPrice || null,
//             discountPercentage: product.variants?.discountPercentage || null,
//             categoryId: product.categoriesId,
//             stock: product.variants.stock,
//             color: product.variants?.color,
//         }));

//         // console.log("Filtered products:", formattedProducts);
//         res.status(200).json({ products: formattedProducts });
//     } catch (error) {
//         console.error("Error filtering products:", error);
//         res.status(500).json({ error: "Failed to filter products" });
//     }
// };

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

// exports.searchProducts = async (req, res) => {
//     try {
//         const { query } = req.query; // Get the search query from request parameters

//         if (!query) {
//             return res.status(400).json({ error: "Search query is required" });
//         }

//         const searchRegex = new RegExp(query, "i"); // Case-insensitive search

//         const products = await Product.aggregate([
//             {
//                 $lookup: {
//                     from: "variants",
//                     localField: "_id",
//                     foreignField: "productId",
//                     as: "variants",
//                 },
//             },
//             {
//                 $unwind: {
//                     path: "$variants",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $match: {
//                     $or: [{ productName: searchRegex }, { brand: searchRegex }],
//                 },
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     productName: 1,
//                     brand: 1,
//                     imageUrl: 1,
//                     "variants.color": 1,
//                     "variants.price": 1,
//                     "variants.rating": 1,
//                     "variants.discountPrice": 1,
//                     "variants.discountPercentage": 1,
//                     categoriesId: 1,
//                     "variants.stock": 1,
//                 },
//             },
//         ]);

//         const formattedProducts = products.map((product) => ({
//             _id: product._id,
//             brand: product.brand,
//             productName: product.productName,
//             imageUrl:
//                 Array.isArray(product.imageUrl) && product.imageUrl.length > 0
//                     ? product.imageUrl[0]
//                     : "/images/default-product.jpg",
//             price: product.variants?.price || null,
//             rating: product.variants?.rating || null,
//             rating: product.variants?.rating || null,
//             discountPrice: product.variants?.discountPrice || null,
//             discountPercentage: product.variants?.discountPercentage || null,
//             categoryId: product.categoriesId,
//             stock: product.variants.stock,
//             color: product.variants?.color,
//         }));

//         // console.log("Searched products:", formattedProducts);
//         res.status(200).json({ products: formattedProducts });
//     } catch (error) {
//         console.error("Error searching products:", error);
//         res.status(500).json({ error: "Failed to search products" });
//     }
// };




exports.searchAndFilterProducts = async (req, res) => {
  try {
    let {
      query,
      gender,
      brand,
      color,
      minPrice,
      maxPrice,
      category,
      stockStatus,
      sort,
    } = req.query;

    // Initialize match criteria
    const matchCriteria = {};

    //query = "fossil"
    // Text-based search
    if (query) {
      const searchRegex = new RegExp(query, "i");
      matchCriteria.$or = [
        { productName: searchRegex },
        { brand: searchRegex },
      ];
    }

    // Price filter
    if (minPrice || maxPrice) {
      matchCriteria["variants.discountPrice"] = {};
      if (minPrice) {
        matchCriteria["variants.discountPrice"].$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        matchCriteria["variants.discountPrice"].$lte = parseFloat(maxPrice);
      }
    }

    // Additional filters
    if (gender) matchCriteria.gender = gender;
    if (brand) matchCriteria.brand = brand;
    if (color) matchCriteria["variants.color"] = color;

    // Validate and filter by category
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        matchCriteria.categoriesId = new mongoose.Types.ObjectId(category);
      } else {
        return res.status(400).json({ error: "Invalid category ID" });
      }
    }

    // Stock status filter
    if (stockStatus) {
      matchCriteria["variants.stock"] = {};
      if (stockStatus === "inStock") {
        matchCriteria["variants.stock"].$gt = 0;
      } else if (stockStatus === "outOfStock") {
        matchCriteria["variants.stock"].$lte = 0;
      }
    }

    // Sorting criteria
    let sortCriteria = {};
    if (sort === "priceLowToHigh") {
      sortCriteria = { "variants.discountPrice": 1 };
    } else if (sort === "priceHighToLow") {
      sortCriteria = { "variants.discountPrice": -1 };
    } else if (sort === "ratingHighToLow") {
      sortCriteria = { "variants.rating": -1 };
    } else if (sort === "newArrivals") {
      sortCriteria = { createdAt: -1 };
    }

    // MongoDB Aggregation Pipeline
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
      { $match: matchCriteria },
      ...(Object.keys(sortCriteria).length > 0
        ? [{ $sort: sortCriteria }]
        : []),
      {
        $project: {
          _id: 1,
          productName: 1,
          brand: 1,
          imageUrl: 1,
          "variants.color": 1,
          "variants.price": 1,
          "variants.rating": 1,
          "variants.discountPrice": 1,
          "variants.discountPercentage": 1,
          categoriesId: 1,
          "variants.stock": 1,
        },
      },
    ]);

    // Format response
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
      stock: product.variants.stock,
      color: product.variants?.color,
    }));

    res.status(200).json({ products: formattedProducts });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
};
