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
      orderDate: new Date(order.createdAt).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
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
        itemTotalPrice: item.itemTotalPrice,
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
    const orderId = req.params.id; 
    const userId = req.session.user._id; 

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).send("Order not found.");
    }

    const orderDetails = {
      _id: order._id,
      orderDate: new Date(order.createdAt).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      couponValue : order.couponValue,
      totalPrice: order.totalPrice,
      paymentMethod: order.payment.paymentMethod,
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
        offerPercentage: item.offerPercentage,
        offerAmount: item.offerAmount,
        priceAfterOffer: item.priceAfterOffer,
        priceWithoutOffer: item.priceWithoutOffer,
        itemTotalPrice: item.itemTotalPrice,
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
    const { orderItemId } = req.body;
    const userId = req.session.user._id;

    const order = await Order.findOne({
      userId,
      "orderItems._id": orderItemId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order or item not found." });
    }

    const orderItem = order.orderItems.find(
      (item) => item._id.toString() === orderItemId
    );

    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found." });
    }

    if (["Shipped", "Delivered"].includes(orderItem.orderStatus)) {
      return res.status(400).json({
        message:
          "Order item cannot be canceled as it is already shipped or delivered.",
      });
    }

    orderItem.orderStatus = "Cancelled";

    const variant = await Variant.findById(orderItem.variant.variantId);
    if (!variant) {
      return res
        .status(404)
        .json({ message: "Associated variant not found in inventory." });
    }

    variant.stock += orderItem.quantity; 
    await variant.save();

    await order.save();

    res.status(200).json({ message: "Order item canceled successfully." });
  } catch (error) {
    console.error("Error canceling order item:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};


exports.submitReturnRequest = async (req, res) => {
  try {
    const { orderItemId, reason } = req.body;

    if (!reason.trim()) {
      return res.status(400).json({ message: "Return reason is required." });
    }

    // Find the order containing the order item
    const order = await Order.findOne({
      "orderItems._id": orderItemId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order item not found." });
    }

    // Locate the specific order item
    const orderItem = order.orderItems.find(
      (item) => item._id.toString() === orderItemId
    );

    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found." });
    }

    // Check if the order status already indicates a return request
    if (
      orderItem.orderStatus === "return-requested" ||
      orderItem.orderStatus === "return-approved"
    ) {
      return res.status(400).json({
        message: "Return request has already been submitted or processed.",
      });
    }

    // Update the order status to "return-requested" and set the reason
    orderItem.orderStatus = "Return-Requested";
    orderItem.returnReason = reason;

    // Save the updated order
    await order.save();

    res.status(200).json({ message: "Return request submitted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to submit return request." });
  }
};


exports.cancelReturnRequest = async (req, res) => {
  try {
    const { orderItemId } = req.body;

    // Find the order containing the order item
    const order = await Order.findOne({
      "orderItems._id": orderItemId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order item not found." });
    }

    // Locate the specific order item
    const orderItem = order.orderItems.find(
      (item) => item._id.toString() === orderItemId
    );

    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found." });
    }

    // Check if the order status is eligible for cancellation
    if (orderItem.orderStatus !== "Return-Requested") {
      return res.status(400).json({
        message: "Return request cannot be canceled at this stage.",
      });
    }

    // Update the order status to "Processing" or the appropriate default status
    orderItem.orderStatus = "Return-Cancelled"; // Or "Delivered" depending on your workflow
    orderItem.returnReason = null; // Clear the return reason if needed

    // Save the updated order
    await order.save();

    res.status(200).json({ message: "Return request canceled successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to cancel return request." });
  }
};
