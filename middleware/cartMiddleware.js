const mongoose = require("mongoose");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");

const getCartQuantity = async (req, res, next) => {
    try {
        if (req.session.user) {
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
            res.locals.cartQuantity =
                totalQuantity.length > 0 ? totalQuantity[0].totalQuantity : 0;
        } else {
            res.locals.cartQuantity = 0;
        }

        next();
    } catch (error) {
        console.error("Error fetching cart quantity:", error);
        res.locals.cartQuantity = 0;
        next();
    }
};

module.exports = getCartQuantity;
