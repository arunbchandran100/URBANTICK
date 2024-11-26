const Address = require("../../models/addressModel");
const Cart = require("../../models/cartModel");


exports.getCheckout = async (req, res) => {
  try {
    const userId = req.session.user._id; // Assuming `req.user` contains authenticated user details
    const userAddresses = await Address.find({ userId }); // Fetch user addresses
    // console.log(userAddresses);
    const cartItems = await Cart.find({ userId }).populate("productId").populate("variantId"); // Fetch cart items with product details
    console.log(cartItems);

    res.render("user/checkOutpage", {
      userAddresses,
      cartItems,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the checkout page.");
  }
};
