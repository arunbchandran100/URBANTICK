const mongoose = require("mongoose");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");

const getCartQuantity = async (req, res, next) => {
    try {
        if (req.session.user) {
            // Check if the user is logged in
            const userId = new mongoose.Types.ObjectId(req.session.user._id);

            //console.log("User ID:", userId);

            // Check if there are any matching documents
            const userCartItems = await Cart.find({ userId: userId });
            //console.log("User Cart Items:", userCartItems);

            // Aggregate the total quantity for the user's cart
            const totalQuantity = await Cart.aggregate([
                {
                    $match: { userId: userId }, // Match all cart items for the logged-in user
                },
                {
                    $group: {
                        _id: null, // No grouping key needed, we're summing up all matched documents
                        totalQuantity: { $sum: "$quantity" }, // Sum the 'quantity' field
                    },
                },
            ]);

            //console.log("Total Quantity:", totalQuantity);

            // Set the totalQuantity or default to 0 if no cart items
            res.locals.cartQuantity =
                totalQuantity.length > 0 ? totalQuantity[0].totalQuantity : 0;
        } else {
            // If the user is not logged in, set cartQuantity to 0
            res.locals.cartQuantity = 0;
        }

        next(); // Proceed to the next middleware or route
    } catch (error) {
        console.error("Error fetching cart quantity:", error);
        res.locals.cartQuantity = 0; // Default to 0 in case of error
        next();
    }
};

module.exports = getCartQuantity;
