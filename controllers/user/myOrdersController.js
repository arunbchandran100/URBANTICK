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
        message: "No Active orders to generate an invoice for this order.",
      });
    }

    // Prepare the filename
    const filename = `invoice-${orderId}.pdf`;

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Title
    doc
      .fontSize(18)
      .text("Order Invoice", { align: "center", underline: true });
    doc.moveDown();

    // Order details
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`Order ID:`, { continued: true })
      .font("Helvetica")
      .text(`${order._id}`);
    doc
      .font("Helvetica-Bold")
      .text(`Order Date:`, { continued: true })
      .font("Helvetica")
      .text(`${new Date(order.createdAt).toLocaleString()}`);
    doc
      .font("Helvetica-Bold")
      .text(`Customer Name:`, { continued: true })
      .font("Helvetica")
      .text(`${order.userName}`);
    doc.moveDown();

    // Shipping Address
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Shipping Address:", { underline: true });
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
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`Name:`, { continued: true })
      .font("Helvetica")
      .text(` ${Name}`);
    doc
      .font("Helvetica-Bold")
      .text(`House:`, { continued: true })
      .font("Helvetica")
      .text(` ${HouseName}`);
    doc
      .font("Helvetica-Bold")
      .text(`Street:`, { continued: true })
      .font("Helvetica")
      .text(` ${LocalityStreet}`);
    doc
      .font("Helvetica-Bold")
      .text(`City:`, { continued: true })
      .font("Helvetica")
      .text(` ${TownCity}`);
    doc
      .font("Helvetica-Bold")
      .text(`State:`, { continued: true })
      .font("Helvetica")
      .text(` ${state}`);
    doc
      .font("Helvetica-Bold")
      .text(`Country:`, { continued: true })
      .font("Helvetica")
      .text(` ${country}`);
    doc
      .font("Helvetica-Bold")
      .text(`Pincode:`, { continued: true })
      .font("Helvetica")
      .text(` ${pincode}`);
    doc
      .font("Helvetica-Bold")
      .text(`Mobile:`, { continued: true })
      .font("Helvetica")
      .text(` ${MobileNumber}`);
    doc.moveDown();

    // Order Items Table Header
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Order Items:", { underline: true });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        "___________________________________________________________________________"
      );
    doc
      .font("Helvetica-Bold")
      .text(
        `S.No       Product                         Brand              Color         Price         Quantity       Total`,
        { align: "left" }
      );
    doc
      .fontSize(12)
      .text(
        "___________________________________________________________________________"
      );

    // Order Items Table Rows
    validOrderItems.forEach((item, index) => {
      const { productName, brand } = item.product;
      const { color, discountPrice } = item.variant;
      const total = item.itemTotalPrice || 0;

      doc
        .font("Helvetica")
        .text(
          `${(index + 1).toString().padEnd(10)}${productName.padEnd(
            30
          )}${brand.padEnd(20)}${color.padEnd(15)}₹${discountPrice
            .toFixed(2)
            .padEnd(10)}${item.quantity.toString().padEnd(15)}₹${total.toFixed(
            2
          )}`
        );
    });

    doc
      .fontSize(12)
      .text(
        "___________________________________________________________________________"
      );
    doc.moveDown();

    // Payment Summary Table
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Payment Summary:", { underline: true });
    doc.moveDown();
    const summaryData = [
      { label: "Subtotal", value: `₹${order.Subtotal.toFixed(2)}` },
      {
        label: "Offer Discounts",
        value: `₹${order.totalOfferValue.toFixed(2)}`,
      },
      {
        label: "Coupon Discounts",
        value: `₹${order.totalCouponValue.toFixed(2)}`,
      },
      { label: "Total Price", value: `₹${order.totalPrice.toFixed(2)}` },
      { label: "Payment Method", value: `${order.payment.paymentMethod}` },
      { label: "Payment Status", value: `${order.payment.paymentStatus}` },
    ];

    summaryData.forEach((row) => {
      doc
        .font("Helvetica-Bold")
        .text(`${row.label.padEnd(20)}:`, { continued: true })
        .font("Helvetica")
        .text(` ${row.value}`);
    });

    doc.moveDown();

    // Thank You Message
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Thank you for your order!", { align: "center" });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};
