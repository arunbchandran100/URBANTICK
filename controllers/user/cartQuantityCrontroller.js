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
        console.log('quantity is ');
        console.log(totalQuantity);
        res
            .status(200)
            .json({ totalQuantity: totalQuantity[0]?.totalQuantity || 0 });
    } catch (error) {
        console.error("Error fetching total cart quantity:", error);
        res.status(500).json({ message: "Error fetching cart quantity" });
    }
};
