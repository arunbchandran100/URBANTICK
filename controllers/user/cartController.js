const Product = require("../../models/productSchema");
const Category = require("../../models/categoryModel");
const Variant = require("../../models/variantSchema");

const mongoose = require("mongoose"); // Import mongoose
const Cart = require("../../models/cartModel");

exports.addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;

    // console.log(
    //   "productId is " +
    //     productId +
    //     " variant " +
    //     variantId +
    //     " quantity is " +
    //     quantity +
    //     " and userId is " +
    //     req.session.user._id
    // );

    if (!productId || !variantId || !quantity) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const nvariant = await Variant.findOne(
      { color: variantId, productId: productId },
      { _id: 1 }
    );
    if (!nvariant) {
      throw new Error("Variant not found");
    }
    const nvariantid = nvariant._id;
    // console.log(111111111 + "variant id is " + nvariantid);

    const userId = req.session.user._id;
    // console.log(userId + " User id");

    let cartItem = await Cart.findOne({
      userId,
      productId,
      variantId: nvariantid,
    });
    // console.log(cartItem + " cart item");
    if (cartItem) {
      if (cartItem.quantity + quantity > 5) {
        return res
          .status(400)
          .json({ message: "Maximum quantity of 5 allowed." });
      }
      cartItem.quantity += quantity;

      await cartItem.save();
    } else {
      cartItem = new Cart({
        userId,
        productId,
        variantId: nvariantid,
        quantity,
      });
      await cartItem.save();
    }

    res.status(200).json({ message: "Item added to cart successfully." });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};


exports.getCart = async(req,res) =>{
  res.render("user/cart", );
}