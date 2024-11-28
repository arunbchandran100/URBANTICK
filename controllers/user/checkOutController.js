const Address = require("../../models/addressModel");
const Cart = require("../../models/cartModel");
const Order = require("../../models/orderModel"); 
const ProductVariant = require("../../models/variantSchema");  
const { ObjectId } = require("mongoose").Types;


exports.getCheckout = async (req, res) => {
  try {
    const userId = req.session.user._id;  
    const userAddresses = await Address.find({ userId }); 
    // console.log(userAddresses);
    const cartItems = await Cart.find({ userId }).populate("productId").populate("variantId"); 

    res.render("user/checkOutpage", {
      userAddresses,
      cartItems,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the checkout page.");
  }
};



exports.placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;  
    const { selectedAddress, paymentMethod } = req.body;

    if (!selectedAddress || !paymentMethod) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const shippingAddress = await Address.findById(selectedAddress);
    if (!shippingAddress) {
      return res.status(404).json({ error: "Invalid address selected" });
    }

    const cartItems = await Cart.find({ userId })
      .populate("productId")
      .populate("variantId");

    if (!cartItems.length) {
      return res.status(400).json({ error: "Your cart is empty" });
    }

    const orderItems = cartItems.map((item) => ({
      orderId: new ObjectId(),
      product: {
        productId: item.productId._id,
        brand: item.productId.brand,
        productName: item.productId.productName,
        imageUrl: item.productId.imageUrl[0],
      },
      variant: {
        variantId: item.variantId._id,
        color: item.variantId.color,
        discountPrice: item.variantId.discountPrice,
      },
      orderStatus: "Processing",
      quantity: item.quantity,
    }));

    const totalPrice = orderItems.reduce(
      (acc, item) => acc + item.variant.discountPrice * item.quantity,
      0
    );

    const newOrder = new Order({
      userId,
      userName: req.session.user.fullName,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
    });

    await newOrder.save();
    
    for (const item of cartItems) {
      const variant = await ProductVariant.findById(item.variantId._id);
      if (variant.stock < item.quantity) {
        return res
        .status(400)
        .json({ error: "Insufficient stock for some items" });
      }
      variant.stock -= item.quantity;
      await variant.save();
    }
    
    
    await Cart.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: "Order placed successfully!",
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res
      .status(500)
      .json({ error: "An error occurred while placing the order" });
  }
};
