const Address = require("../../models/addressModel");
const Cart = require("../../models/cartModel");
const Order = require("../../models/orderModel");
const ProductVariant = require("../../models/variantSchema");
const Offer = require("../../models/offerModel");
const { ObjectId } = require("mongoose").Types;
const Coupon = require("../../models/couponModel");
const mongoose = require("mongoose");
require("dotenv").config();
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getCheckout = async (req, res) => {
  try {
    // Update expired offers
    let offers = await Offer.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    offers.forEach(async (offer) => {
      const offerEndDate = new Date(offer.endDate);
      if (offerEndDate < today) {
        offer.isActive = false;
        await offer.save();
      }
    });

    const userId = req.session.user._id;
    const userAddresses = await Address.find({ userId });

    offers = await Offer.find({ isActive: true });
    const cartItems = await Cart.find({ userId })
      .populate("productId")
      .populate("variantId");

    let subtotal = 0;
    let totalDiscount = 0;

    const formattedCartItems = cartItems.map((item) => {
      const product = item.productId;
      const discountPrice = item.variantId.discountPrice;
      const variant = item.variantId;

      let applicableOffers = [];
      let bestOffer = { discountPercentage: 0 };

      applicableOffers = offers.filter(
        (offer) =>
          offer.offerType === "Product" &&
          String(offer.applicableProduct) === String(product._id)
      );

      if (product.categoriesId) {
        const categoryOffers = offers.filter(
          (offer) =>
            offer.offerType === "Category" &&
            String(offer.applicableCategory) === String(product.categoriesId)
        );
        applicableOffers = applicableOffers.concat(categoryOffers);
      }

      if (applicableOffers.length > 0) {
        bestOffer = applicableOffers.reduce((max, current) =>
          current.discountPercentage > max.discountPercentage ? current : max
        );
      }

      const offerPercentage = bestOffer.discountPercentage || 0;
      const offerAmount = (discountPrice * offerPercentage) / 100;
      const afterOfferPrice = discountPrice - offerAmount;

      subtotal += discountPrice * item.quantity;
      totalDiscount += offerAmount * item.quantity;

      return {
        _id: item._id,
        product,
        variant,
        quantity: variant && variant.stock > 0 ? item.quantity : 0,
        offerPercentage,
        offerAmount,
        afterOfferPrice: afterOfferPrice > 0 ? afterOfferPrice : 0,
        offerType: bestOffer.offerType || null,
        offerTitle: bestOffer.title,
        couponIsApplied: bestOffer.discountPercentage > 0,
      };
    });

    const totalAfterDiscount = subtotal - totalDiscount;

    //make expired coupons Status to False
    let Coupons = await Coupon.find();
    today.setHours(0, 0, 0, 0);

    Coupons.forEach(async (coupon) => {
      const couponEndDate = new Date(coupon.endDate);
      if (couponEndDate < today) {
        coupon.isActive = false;
        await coupon.save();
      }
    });

    // Fetch available coupons
    const availableCoupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    const validCoupons = [];
    for (const coupon of availableCoupons) {
      const userUsage = coupon.usageByUser.find(
        (usage) => String(usage.userId) === String(userId)
      );

      const userUsageCount = userUsage ? userUsage.count : 0;

      if (
        totalAfterDiscount >= coupon.minimumPurchaseAmount &&
        userUsageCount < coupon.perUserUsageLimit
      ) {
        validCoupons.push(coupon);
      }
    }

    res.render("user/checkOutpage", {
      userAddresses,
      cartItems: formattedCartItems,
      subtotal,
      totalDiscount,
      totalAfterDiscount,
      availableCoupons: validCoupons,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the checkout page.");
  }
};

exports.placeOrder = async (req, res) => {
  try {
    // Update expired offers
    let offers = await Offer.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    offers.forEach(async (offer) => {
      const offerEndDate = new Date(offer.endDate);
      if (offerEndDate < today) {
        offer.isActive = false;
        await offer.save();
      }
    });

    const userId = req.session.user._id;
    const { selectedAddress, paymentMethod, appliedCouponCode } = req.body;

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

    const activeOffers = await Offer.find({ isActive: true });

    let subtotal = 0;
    let totalOfferValue = 0;
    let totalPrice = 0;

    const orderItems = cartItems.map((item) => {
      const product = item.productId;
      const variant = item.variantId;
      const discountPrice = item.variantId.discountPrice;

      let applicableOffers = [];
      let bestOffer = { discountPercentage: 0 };

      // Filter applicable and active offers
      applicableOffers = activeOffers.filter(
        (offer) =>
          offer.isActive && // Check if the offer is active
          offer.offerType === "Product" &&
          String(offer.applicableProduct) === String(product._id)
      );

      if (product.categoriesId) {
        const categoryOffers = offers.filter(
          (offer) =>
            offer.isActive && // Check if the offer is active
            offer.offerType === "Category" &&
            String(offer.applicableCategory) === String(product.categoriesId)
        );
        applicableOffers = applicableOffers.concat(categoryOffers);
      }

      // Determine the best offer
      if (applicableOffers.length > 0) {
        bestOffer = applicableOffers.reduce((max, current) =>
          current.discountPercentage > max.discountPercentage ? current : max
        );
      }

      let offerAmount = 0;
      const offerPercentage = bestOffer.discountPercentage || 0;
      if (offerPercentage > 0) {
        offerAmount = (discountPrice * offerPercentage) / 100;
      }

      const priceAfterOffer = discountPrice - offerAmount;
      const itemTotalPrice = priceAfterOffer * item.quantity;
      const totalPriceWithoutOffer = discountPrice * item.quantity;

      subtotal += totalPriceWithoutOffer;
      totalOfferValue += offerAmount * item.quantity;

      const generateOrderID = () => {
        const characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let orderID = "#";
        for (let i = 0; i < 5; i++) {
          orderID += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return orderID;
      };

      return {
        order_id: generateOrderID(),
        product: {
          productId: product._id,
          brand: product.brand,
          productName: product.productName,
          imageUrl: product.imageUrl[0],
        },
        variant: {
          variantId: variant._id,
          color: variant.color,
          discountPrice: variant.discountPrice,
        },
        quantity: item.quantity,
        orderStatus: "Processing",
        offerType: bestOffer.offerType || null,
        offerTitle: bestOffer.title || null,
        offerPercentage,
        offerAmount,
        priceAfterOffer,
        priceWithoutOffer: discountPrice,
        itemTotalPrice,
        priceWithoutCoupon: itemTotalPrice,
        CouponAmountOfItem: 0,
        priceAfterCoupon: itemTotalPrice,
      };
    });


    // Check and apply the coupon
    let couponDiscount = 0;
    let coupon;
    if (appliedCouponCode) {
      coupon = await Coupon.findOne({
        couponCode: appliedCouponCode,
        isActive: true,
      });

      if (!coupon) {
        return res.status(400).json({ error: "Invalid or expired coupon" });
      }

      if (subtotal < coupon.minimumPurchaseAmount) {
        return res.status(400).json({
          error: `Minimum purchase amount for this coupon is ${coupon.minimumPurchaseAmount}`,
        });
      }

      const userUsage = coupon.usageByUser.find(
        (usage) => String(usage.userId) === String(userId)
      );
      const userUsageCount = userUsage ? userUsage.count : 0;

      if (userUsageCount >= coupon.perUserUsageLimit) {
        return res
          .status(400)
          .json({ error: "Coupon usage limit reached for this user" });
      }

      if (coupon.couponType === "percentage") {
        couponDiscount = (subtotal * coupon.couponValue) / 100;
      } else if (coupon.couponType === "flat") {
        couponDiscount = coupon.couponValue;
      }

      couponDiscount = Math.min(couponDiscount, subtotal); // Ensure the discount doesn't exceed the subtotal

      // Update the coupon usage
      if (userUsage) {
        userUsage.count += 1;
      } else {
        coupon.usageByUser.push({ userId, count: 1 });
      }

      await coupon.save();
    }

    // Distribute coupon discount among items based on their weightage
    const totalItemPrice = orderItems.reduce(
      (sum, item) => sum + item.itemTotalPrice,
      0
    );

    orderItems.forEach((item) => {
      const itemWeightage = item.itemTotalPrice / totalItemPrice;
      const couponAmountOfItem = couponDiscount * itemWeightage;
      item.CouponAmountOfItem = couponAmountOfItem;
      item.priceAfterCoupon = item.itemTotalPrice - couponAmountOfItem;
      item.itemTotalPrice = item.priceAfterCoupon;
    });

    totalPrice = subtotal - couponDiscount;

    // Above 1000 is Online payment
    if (paymentMethod === "Cash on Delivery" && totalPrice > 1000) {
      return res
        .status(400)
        .json({ error: "Use Online Payment For orders Above 1000" });
    }

    const newOrder = new Order({
      userId,
      userName: req.session.user.fullName,
      orderItems,
      shippingAddress,
      payment: {
        paymentMethod,
        paymentStatus: "Pending",
      },
      couponCode: appliedCouponCode || null,
      couponType: coupon ? coupon.couponType : null,
      totalCouponValue: couponDiscount || 0, // Save total coupon value
      totalOfferValue, // Save total offer value
      Subtotal: subtotal, // Save order subtotal
      totalPrice,
    });

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

    await newOrder.save();
    await Cart.deleteMany({ userId });

    if (paymentMethod === "Online Payment") {
      const razorpayOrder = await razorpay.orders.create({
        amount: totalPrice * 100,
        currency: "INR",
        receipt: newOrder._id.toString(),
      });

      return res.status(200).json({
        success: true,
        message: "Order created successfully",
        order: razorpayOrder,
        orderId: newOrder._id,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Order placed successfully!",
        orderId: newOrder._id,
      });
    }
  } catch (error) {
    console.error("Error placing order:", error);
    res
      .status(500)
      .json({ error: "An error occurred while placing the order" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentResponse, order } = req.body;
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${order.id}|${paymentResponse.razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest === paymentResponse.razorpay_signature) {
      // Fetch the order first
      const existingOrder = await Order.findById(order.receipt);
      if (!existingOrder) {
        console.error("Order not found for Razorpay order ID:", order.id);
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      // Update only items that are not already cancelled
      existingOrder.orderItems.forEach((item) => {
        if (item.orderStatus !== "Cancelled") {
          item.orderStatus = "Processing";
        }
      });

      // Update payment details
      existingOrder.payment.paymentStatus = "Paid";
      existingOrder.payment.razorpayOrderId = order.id;
      existingOrder.payment.razorpayPaymentId =
        paymentResponse.razorpay_payment_id;

      // Save the updated order
      await existingOrder.save();

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      // Invalid signature, mark payment as pending
      await Order.findOneAndUpdate(
        { _id: order.receipt },
        { $set: { "payment.paymentStatus": "Pending" } },
        { new: true }
      );

      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Payment verification error: ", error);

    // In case of error, mark payment as pending
    await Order.findOneAndUpdate(
      { _id: order.receipt },
      { $set: { "payment.paymentStatus": "Pending" } },
      { new: true }
    );

    return res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};



exports.retryPayment = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Fetch the order from the database
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    if (
      existingOrder.payment.paymentStatus !== "Pending" ||
      existingOrder.payment.paymentMethod !== "Online Payment"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Retry payment is only applicable for pending online payments.",
      });
    }

    // Ensure the total price is converted to an integer (paise) for Razorpay
    const amountInPaise = Math.round(existingOrder.totalPrice * 100);

    // Create a new Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise, // Convert to paise and ensure it's an integer
      currency: "INR",
      receipt: existingOrder._id.toString(),
    });

    // Update the existing order with the new Razorpay order details
    existingOrder.payment.razorpayOrderId = razorpayOrder.id;
    existingOrder.payment.paymentStatus = "Pending"; // Keep it pending until verified
    await existingOrder.save();

    return res.status(200).json({
      success: true,
      message: "Retry payment initiated successfully.",
      order: razorpayOrder,
    });
  } catch (error) {
    console.error("Error initiating retry payment:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrying the payment.",
    });
  }
};



module.exports = exports;
