const mongoose = require("mongoose");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");

const getCartAndWishlistQuantity = async (req, res, next) => {
    try {
        if (req.session.user) {
            const userId = new mongoose.Types.ObjectId(req.session.user._id);

            // Fetch total cart quantity
            const totalCartQuantity = await Cart.aggregate([
                { $match: { userId: userId } },
                {
                    $group: {
                        _id: null,
                        totalQuantity: { $sum: "$quantity" },
                    },
                },
            ]);

            // Fetch total wishlist count
            const wishlistCount = await Wishlist.countDocuments({ userId });

            // Set cart quantity and wishlist count in res.locals
            res.locals.cartQuantity =
                totalCartQuantity.length > 0 ? totalCartQuantity[0].totalQuantity : 0;
            res.locals.wishlistQuantity = wishlistCount || 0;
        } else {
            // If no user session, set both quantities to 0
            res.locals.cartQuantity = 0;
            res.locals.wishlistQuantity = 0;
        }

        next();
    } catch (error) {
        console.error("Error fetching cart and wishlist quantities:", error);
        res.locals.cartQuantity = 0;
        res.locals.wishlistQuantity = 0;
        next();
    }
};

module.exports = getCartAndWishlistQuantity;
