const Wishlist = require("../../models/wishlistModel");
const Product = require("../../models/productSchema"); // Import the Product model
const mongoose = require("mongoose"); // Import mongoose

exports.getWishlist = async (req, res) => {
    try {
        const userId = req.session.user?._id; // Assuming userId is stored in the session
        // console.log(userId);

        // Fetch wishlist items for the user
        const wishlistItems = await Wishlist.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: "products", // Link to the Product collection
                    localField: "productId",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            {
                $lookup: {
                    from: "variants", // Link to the Variant collection
                    localField: "variantId",
                    foreignField: "_id",
                    as: "variantDetails",
                },
            },
            {
                $unwind: "$productDetails", // Flatten productDetails array
            },
            {
                $unwind: "$variantDetails", // Flatten variantDetails array
            },
            {
                $project: {
                    _id: 1,
                    productId: 1,
                    variantId: 1,
                    addedAt: 1,
                    "productDetails.productName": 1,
                    "productDetails.imageUrl": 1,
                    "productDetails.brand": 1,
                    "variantDetails.color": 1,
                    "variantDetails.price": 1,
                    "variantDetails.discountPrice": 1,
                    "variantDetails.stock": 1,
                },
            },
        ]);


        res.render("user/wishlist", { wishlistItems });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        res.status(500).send("An error occurred while fetching the wishlist.");
    }
};




// Add product to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(400).json({ error: "User not logged in" });
        }

        //console.log(22222222);
        const { productId, variantId } = req.body;
        const userId = req.session.user?._id;

        //console.log(userId + " productId " + productId + " variantId " + variantId);
        if (!productId || !variantId) {
            return res
                .status(400)
                .json({ error: "Product ID and Variant ID are required." });
        }

        // Check if the product is already in the wishlist
        const existingWishlistItem = await Wishlist.findOne({
            userId,
            productId,
            variantId,
        });

        if (existingWishlistItem) {
            return res
                .status(409)
                .json({ error: "Product is already in your wishlist." });
        }

        // Add to wconsole.log(8585);

        const newWishlistItem = new Wishlist({ userId, productId, variantId });

        await newWishlistItem.save();

        res.status(201).json({ message: "Product added to wishlist." });
        // console.log(665522222000000);

    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({ error: "Failed to add to wishlist." });
    }
};


exports.removeFromWishlist = async (req, res) => {
    try {
        const { wishlistId } = req.params; 
        await Wishlist.findByIdAndDelete(wishlistId);
        res.status(200).send({ message: "Item removed from wishlist." });
    } catch (error) {
        console.error("Error removing wishlist item:", error);
        res.status(500).send({ error: "Failed to remove item from wishlist." });
    }
};
