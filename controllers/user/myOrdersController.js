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
        brand: item.product.brand,
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
      orderDate: new Date(order.createdAt).toDateString(),
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      items: order.orderItems.map((item) => ({
        orderItemId: item._id,
        orderId: item.order_id,
        brand: item.product.brand,
        productName: item.product.productName,
        imageUrl: item.product.imageUrl,
        color: item.variant.color,
        discountPrice: item.variant.discountPrice,
        quantity: item.quantity,
        orderStatus: item.orderStatus,
      })),
      shippingAddress: {
        name: order.shippingAddress.Name,
        street: order.shippingAddress.HouseName,
        locality: order.shippingAddress.LocalityStreet,
        city: order.shippingAddress.TownCity,
        state: order.shippingAddress.state,
        country: order.shippingAddress.country,
        zipCode: order.shippingAddress.pincode,
        phone: order.shippingAddress.MobileNumber,
      },
    };

    // Render the order details page with the prepared data
    res.render("user/viewOrderDetails", {
      order: orderDetails,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).send("Internal Server Error");
  }
};




exports.cancelOrderItem = async (req, res) => {
  try {
    const { orderItemId } = req.body; // Extract the order item ID from the request body
    const userId = req.session.user._id; // Get the user ID from the session

    // Find the order containing the specific order item
    const order = await Order.findOne({
      userId,
      "orderItems._id": orderItemId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order or item not found." });
    }

    // Find the specific order item
    const orderItem = order.orderItems.find(
      (item) => item._id.toString() === orderItemId
    );

    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found." });
    }

    // Check if the order item is eligible for cancellation
    if (["Shipped", "Delivered"].includes(orderItem.orderStatus)) {
      return res.status(400).json({
        message:
          "Order item cannot be canceled as it is already shipped or delivered.",
      });
    }

    // Update the order item's status to "Cancelled"
    orderItem.orderStatus = "Cancelled";

    // Save the updated order
    await order.save();

    res.status(200).json({ message: "Order item canceled successfully." });
  } catch (error) {
    console.error("Error canceling order item:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};
