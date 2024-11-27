const Product = require("../../models/productSchema");
const Category = require("../../models/categoryModel");
const Variant = require("../../models/variantSchema");
const mongoose = require("mongoose");
const Cart = require("../../models/cartModel");


const Order = require("../../models/orderModel");


exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ userId });
    const userOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const ordersWithDetails = userOrders.map((order) => ({
      _id: order._id,
      orderDate: order.createdAt.toDateString(),
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      items: order.orderItems.map((item) => ({
        productName: item.product.productName,
        imageUrl: item.product.imageUrl,
        color: item.variant.color,
        discountPrice: item.variant.discountPrice,
        quantity: item.quantity,
        orderStatus: item.orderStatus,
      })),
    }));


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


// exports.getOrderDetails = async (req, res) => {
//   res.render("user/viewOrderDetails");
// };



exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id; // Get order ID from URL parameters
    const userId = req.session.user._id; // Get user ID from session

    // Fetch the order details for the specific user and order
    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).send("Order not found.");
    }

    // Prepare the order details for rendering
    const orderDetails = {
      _id: order._id,
      orderDate: order.createdAt.toDateString(),
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      orderStatus: order.orderStatus,
      items: order.orderItems.map((item) => ({
        orderItemId: item._id,
        orderId: item.order_id,
        productName: item.product.productName,
        imageUrl: item.product.imageUrl,
        color: item.variant.color,
        discountPrice: item.variant.discountPrice,
        quantity: item.quantity,
        orderStatus: item.orderStatus,
      })),
    };

    console.log(orderDetails);

    // Render the order details page with the prepared data
    res.render("user/viewOrderDetails", {
      order: orderDetails,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).send("Internal Server Error");
  }
};
