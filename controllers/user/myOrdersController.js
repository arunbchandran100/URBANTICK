const Product = require("../../models/productSchema");
const Category = require("../../models/categoryModel");
const Variant = require("../../models/variantSchema");
const mongoose = require("mongoose"); 
const Cart = require("../../models/cartModel");


const Order = require("../../models/orderModel"); // Import the Order model


exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.session.user._id; // Get the user ID from the session
    const page = parseInt(req.query.page) || 1; // Get the current page from query params, default to 1
    const limit = 5; // Number of orders per page
    const skip = (page - 1) * limit; // Skip orders for previous pages

    // Fetch orders with pagination
    const totalOrders = await Order.countDocuments({ userId });
    const userOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Prepare orders with relevant details for rendering
    const ordersWithDetails = userOrders.map((order) => ({
      _id: order._id, // Order ID
      orderDate: order.createdAt.toDateString(), // Order date
      totalPrice: order.totalPrice, // Total order price
      paymentMethod: order.paymentMethod, // Payment method
      orderStatus: order.orderStatus, // Order status
      items: order.orderItems.map((item) => ({
        productName: item.product.productName, // Product name
        imageUrl: item.product.imageUrl, // Product image
        color: item.variant.color, // Variant color
        price: item.variant.price, // Price
        quantity: item.quantity, // Quantity
      })),
    }));

    // Render the My Orders page with pagination info
    res.render("user/userMyOrders", {
      orders: ordersWithDetails,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
};
