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



exports.getCart = async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Fetch cart items for the user
    const cartItems = await Cart.find({ userId })
      .populate("productId")
      .populate("variantId");

    // Format cart items to include product and variant details
    const formattedCartItems = cartItems.map((item) => ({
      _id: item._id,
      product: item.productId,
      variant: item.variantId,
      quantity: item.quantity,
    }));

    // console.log(222222222);
    // console.log(formattedCartItems);

    res.render("user/cart", { cartItems: formattedCartItems });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).send("Server Error");
  }
};


exports.deleteFromCart = async (req, res) => {
  try {
    console.log(22222222222222222);
    const cartItemId = req.params.id;
    const userId = req.session.user._id;

    // Find and delete the cart item
    const result = await Cart.findOneAndDelete({ _id: cartItemId, userId });

    if (result) {
      res.status(200).json({ message: "Item removed from cart" });
    } else {
      res.status(404).json({ message: "Item not found in cart" });
    }
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

