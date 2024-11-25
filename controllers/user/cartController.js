const Product = require("../../models/productSchema");
const Category = require("../../models/categoryModel");
const Variant = require("../../models/variantSchema");

const mongoose = require("mongoose"); // Import mongoose
const Cart = require("../../models/cartModel");


exports.addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;

    console.log(
      "productId is " +
        productId +
        " variant " +
        variantId +
        " quantity is " +
        quantity +
        " and userId is " +
        req.session.user._id
    );
    if (!productId || !variantId || !quantity) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // // Validate IDs
    // if (
    //   !mongoose.Types.ObjectId.isValid(productId) ||
    //   !mongoose.Types.ObjectId.isValid(variantId)
    // ) {
    //   return res
    //     .status(400)
    //     .json({ message: "Invalid Product or Variant ID." });
    // }

    // // Check if the product exists
    // const product = await Product.findById(productId);
    // if (!product) {
    //   return res.status(404).json({ message: "Product not found." });
    // }

    // // Check if the variant exists
    // const variant = await Variant.findById(variantId);
    // if (!variant) {
    //   return res.status(404).json({ message: "Variant not found." });
    // }

    // Check stock availability
    // if (variant.stock < quantity) {
    //   return res
    //     .status(400)
    //     .json({ message: `Only ${variant.stock} items in stock.` });
    // }


const nvariant = await Variant.findOne({ color: variantId }, { _id: 1 });
if (!nvariant) {
  throw new Error("Variant not found");
}
const nvariantid = nvariant._id;
console.log(111111111 + "variant id is " + nvariantid);

// Check if the cart already has this product/variant for the user
const userId = req.session.user._id; // Assuming user is authenticated
console.log(userId + " User id");

let cartItem = await Cart.findOne({ userId, productId, variantId: nvariantid });
console.log(cartItem + " cart item");
if (cartItem) {
  // Update quantity
  cartItem.quantity += quantity;
  await cartItem.save();
} else {
  // Add new item to cart
  cartItem = new Cart({
    userId,
    productId,
    variantId: nvariantid,
    quantity,
  });
  console.log(22222222 + "cart item is" + cartItem);
  await cartItem.save();
}


    res.status(200).json({ message: "Item added to cart successfully." });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
