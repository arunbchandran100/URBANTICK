const adminAuthenticated = require("../../middleware/adminauthmildware");

const Order = require("../../models/orderModel");
const User = require("../../models/userModel");
const Variant = require("../../models/variantSchema");
const Wallet = require("../../models/walletModel");


exports.getAdminOrders = [
  adminAuthenticated,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const totalOrders = await Order.countDocuments();
      const orders = await Order.find()
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 })
        .lean(); // Use lean() to get plain JavaScript objects

      orders.forEach((order) => {
        if (order.orderItems.length > 0) {
          order.computedOrderStatus = order.orderItems[0].orderStatus;
        } else {
          order.computedOrderStatus = "No Items";
        }
      });

      const totalPages = Math.ceil(totalOrders / limit);

      res.render("admin/adminOrders", {
        orders,
        currentPage: page,
        totalPages,
      });
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ error: "Failed to fetch admin orders" });
    }
  },
];




exports.getAdminOrdersDetails = [
  adminAuthenticated,
  async (req, res) => {
    try {
      const { id } = req.params;

      const order = await Order.findById(id);

      if (!order) {
        return res
          .status(404)
          .render("admin/404", { message: "Order not found" });
      }

      const mappedOrder = {
        _id: order._id,
        userName: order.userName,
        orderDate: order.createdAt,
        Subtotal: order.Subtotal,
        totalOfferValue: order.totalOfferValue,
        totalCouponValue: order.totalCouponValue,
        totalPrice: order.totalPrice,
        paymentMethod: order.payment.paymentMethod,
        paymentStatus: order.payment.paymentStatus,
        shippingAddress: order.shippingAddress,
        items: order.orderItems,
      };

      res.render("admin/adminOrdersDetails", { order: mappedOrder });
    } catch (error) {
      console.error("Error fetching admin order details:", error);
      res.status(500).json({ error: "Failed to fetch admin order details" });
    }
  },
];



exports.updateOrderStatus = [
  adminAuthenticated,
  async (req, res) => {
    try {
      const { itemId, orderId, orderStatus } = req.body;

      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const item = order.orderItems.id(itemId);
      if (!item) return res.status(404).json({ error: "Item not found" });

      // Increase stock if order is Cancelled or Returned
      if (orderStatus === "Cancelled") {
        const variant = await Variant.findById(item.variant.variantId);
        if (!variant) {
          return res
            .status(404)
            .json({ error: "Associated variant not found" });
        }
        variant.stock += item.quantity;
        if (order.payment.paymentStatus === "Paid") {
          let wallet = await Wallet.findOne({ userId: order.userId });
          if (!wallet) {
            wallet = new Wallet({
              userId: order.userId,
              balance_amount: 0,
              transactions: [],
            });
          }

          // Refund amount
          const refundAmount = item.itemTotalPrice;

          // Update wallet balance and add a transaction
          wallet.balance_amount += refundAmount;
          wallet.transactions.push({
            transactionType: "CREDIT",
            amount: refundAmount,
            transactionDate: new Date(),
          });

          await wallet.save();
          order.payment.paymentStatus = "Refund Processed for Returned/Cancelled Orders";
        }
        await variant.save();

        order.totalPrice -= item.itemTotalPrice;

      }

      if (orderStatus === "Processing") {
        order.payment.paymentStatus = "Retry Payment Successful";
      }

      if (orderStatus === "Delivered") {
        order.payment.paymentStatus = "Paid";
      }

      item.orderStatus = orderStatus;
      await order.save();

      res.status(200).json({ message: "Order status updated successfully" });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  },
];


exports.handleReturnRequest = async (req, res) => {
  try {
    const { orderId, itemId } = req.body;
    const action = req.url.includes("approve") ? "approve" : "reject";

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    const orderItem = order.orderItems.find(
      (item) => item._id.toString() === itemId
    );
    if (!orderItem)
      return res.status(404).json({ message: "Order item not found." });

    if (orderItem.orderStatus !== "Return-Requested") {
      return res.status(400).json({ message: "Invalid return request state." });
    }

    if (action === "approve") {
      orderItem.orderStatus = "Returned";
      order.payment.paymentStatus = "Refund Processed for Returned/Cancelled Orders";
      // Check if wallet exists, create if not
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
        wallet = new Wallet({
          userId: order.userId,
          balance_amount: 0,
          transactions: [],
        });
      }

      // Refund amount
      const refundAmount = orderItem.itemTotalPrice;

      // Update wallet balance and add a transaction
      wallet.balance_amount += refundAmount;
      wallet.transactions.push({
        transactionType: "CREDIT",
        amount: refundAmount,
        transactionDate: new Date(),
      });

      await wallet.save();

      // Increase product variant quantity
      const variant = await Variant.findById(orderItem.variant.variantId);
      if (!variant) {
        return res.status(404).json({ error: "Associated variant not found" });
      }
      variant.stock += orderItem.quantity;
      await variant.save();

      // Success response for approval
      await order.save();
      return res.status(200).json({
        message: "Return request approved and refund processed successfully.",
        orderStatus: orderItem.orderStatus,
        refundAmount,
      });
    } else {
      orderItem.orderStatus = "Return-Cancelled"; // Revert to previous status
      orderItem.returnReason = null; // Clear the return reason

      // Success response for rejection
      await order.save();
      return res.status(200).json({
        message: "Return request rejected successfully.",
        orderStatus: orderItem.orderStatus,
      });
    }
  } catch (error) {
    console.error("Error handling return request:", error);
    res.status(500).json({ message: "Failed to process return request." });
  }
};

