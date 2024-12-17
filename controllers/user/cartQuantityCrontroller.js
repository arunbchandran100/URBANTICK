const mongoose = require("mongoose");
const Cart = require("../../models/cartModel");
const User = require("../../models/userModel");

exports.getTotalCartQuantity = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user._id);
        const userCartItems = await Cart.find({ userId: userId });
        const totalQuantity = await Cart.aggregate([
            {
                $match: { userId: userId },
            },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$quantity" },
                },
            },
        ]);

        res
            .status(200)
            .json({ totalQuantity: totalQuantity[0]?.totalQuantity || 0 });
    } catch (error) {
        console.error("Error fetching total cart quantity:", error);
        res.status(500).json({ message: "Error fetching cart quantity" });
    }
};


const Wishlist = require("../../models/wishlistModel"); // Adjust the path to your Wishlist model

exports.getWishlistCount = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "User not logged in." });
        }

        const userId = req.session.user._id;

        // Count wishlist items for the user
        const wishlistCount = await Wishlist.countDocuments({ userId });

        res.status(200).json({ wishlistCount });
    } catch (error) {
        console.error("Error fetching wishlist count:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};
