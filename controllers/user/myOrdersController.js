const Product = require("../../models/productSchema");
const Category = require("../../models/categoryModel");
const Variant = require("../../models/variantSchema");
const mongoose = require("mongoose");
const Cart = require("../../models/cartModel");
const Wallet = require("../../models/walletModel");


const Order = require("../../models/orderModel");


exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // Get total order count for pagination
    const totalOrders = await Order.countDocuments({ userId });

    // Fetch user orders
    let userOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Update order status conditionally
    for (let order of userOrders) {
      if (
        order.payment.paymentMethod === "Online Payment" &&
        order.payment.paymentStatus === "Pending"
        && order.orderItems.some((item) => item.orderStatus === "Processing")
      ) {
        // Update individual item statuses
        order.orderItems.forEach((item) => {
          item.orderStatus = "Payment Pending";
        });
        // Save the updated order
        await order.save();
      }
    }

    userOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    // Format orders for rendering
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
      paymentMethod: order.payment.paymentMethod,
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

    // Render the user orders page
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

    let order = await Order.findOne({ _id: orderId, userId });
      if (
        order.payment.paymentMethod === "Online Payment" &&
        order.payment.paymentStatus === "Pending" &&
        order.orderItems.some((item) => item.orderStatus === "Processing")
      ) {
        // Update individual item statuses
        order.orderItems.forEach((item) => {
          item.orderStatus = "Payment Pending";
        });
        // Save the updated order
        await order.save();
      }
    
    order = await Order.findOne({ _id: orderId, userId });

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
      Subtotal: order.Subtotal,
      totalOfferValue: order.totalOfferValue,
      totalCouponValue: order.totalCouponValue,
      totalPrice: order.totalPrice,
      paymentMethod: order.payment.paymentMethod,
      paymentStatus: order.payment.paymentStatus,
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

    if (order.payment.paymentStatus === "Paid") {
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
        wallet = new Wallet({
          userId: order.userId,
          balance_amount: 0,
          transactions: [],
        });
      }

      // Refund amount (adjusting based on coupon and offer amounts)
      const refundAmount = orderItem.priceAfterCoupon;

      // Update wallet balance and add a transaction
      wallet.balance_amount += refundAmount;
      wallet.transactions.push({
        transactionType: "CREDIT",
        amount: refundAmount,
        transactionDate: new Date(),
      });

      await wallet.save();
      order.payment.paymentStatus =
        "Refund Processed for Returned/Cancelled Orders";
    }

    // Adjust order-level totals
    const itemTotalPrice = orderItem.itemTotalPrice;
    const offerAmount = orderItem.offerAmount || 0;
    const couponAmount = orderItem.CouponAmountOfItem || 0;
    const priceWithoutOffer = orderItem.priceWithoutOffer;

    order.Subtotal -= priceWithoutOffer; 
    order.totalPrice -= itemTotalPrice;
    order.totalOfferValue -= offerAmount;
    order.totalCouponValue -= couponAmount;

    orderItem.orderStatus = "Cancelled";

    // Adjust the inventory stock
    const variant = await Variant.findById(orderItem.variant.variantId);
    if (!variant) {
      return res
        .status(404)
        .json({ message: "Associated variant not found in inventory." });
    }

    variant.stock += orderItem.quantity;
    await variant.save();

    await order.save();

    res.status(200).json({
      message: "Order item canceled successfully.",
      updatedOrder: {
        totalPrice: order.totalPrice,
        totalOfferAmount: order.totalOfferAmount,
        totalCouponAmount: order.totalCouponAmount,
      },
    });
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




const PDFDocument = require("pdfkit");

exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Filter out cancelled items
    const validOrderItems = order.orderItems.filter(
      (item) => item.orderStatus !== "Cancelled"
    );

    if (validOrderItems.length === 0) {
      return res.status(400).json({
        message: "No valid items to generate an invoice for this order.",
      });
    }

    // Prepare the filename
    const filename = `invoice-${orderId}.pdf`;

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Create a PDF document
    const doc = new PDFDocument();
    doc.pipe(res);

    // Title
    doc.fontSize(18).text("Order Invoice", { align: "center" });
    doc.moveDown();

    // Order details
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Customer Name: ${order.userName}`);
    doc.moveDown();

    // Shipping Address
    doc.fontSize(14).text("Shipping Address:", { underline: true });
    const {
      Name,
      HouseName,
      LocalityStreet,
      TownCity,
      state,
      country,
      pincode,
      MobileNumber,
    } = order.shippingAddress;
    doc.fontSize(12).text(`Name: ${Name}`);
    doc.text(`House: ${HouseName}`);
    doc.text(`Street: ${LocalityStreet}`);
    doc.text(`City: ${TownCity}`);
    doc.text(`State: ${state}`);
    doc.text(`Country: ${country}`);
    doc.text(`Pincode: ${pincode}`);
    doc.text(`Mobile: ${MobileNumber}`);
    doc.moveDown();

    // Order Items
    doc.fontSize(14).text("Order Items:", { underline: true });
    validOrderItems.forEach((item, index) => {
      const { productName, brand } = item.product;
      const { color, discountPrice } = item.variant;
      doc
        .fontSize(12)
        .text(
          `${
            index + 1
          }. ${brand} ${productName} (Color: ${color}) - ₹${discountPrice.toFixed(
            2
          )} x ${item.quantity} = ₹${(item.itemTotalPrice || 0).toFixed(2)}`
        );
    });
    doc.moveDown();

    // Payment Summary
    doc.fontSize(14).text("Payment Summary:", { underline: true });
    doc.fontSize(12).text(`Subtotal: ₹${order.Subtotal.toFixed(2)}`);
    doc.text(`Offer Discounts: ₹${order.totalOfferValue.toFixed(2)}`);
    doc.text(`Coupon Discounts: ₹${order.totalCouponValue.toFixed(2)}`);
    doc.text(`Total Price: ₹${order.totalPrice.toFixed(2)}`);
    doc.text(`Payment Method: ${order.payment.paymentMethod}`);
    doc.text(`Payment Status: ${order.payment.paymentStatus}`);
    doc.moveDown();

    // Thank You Message
    doc.fontSize(16).text("Thank you for your order!", { align: "center" });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};
