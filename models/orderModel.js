const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
    },
    orderItems: [
      {
        order_id: {
          type: String,
          default: () =>
            `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        },
        variant: {
          type: Object,
        },
        product: {
          type: Object,
        },
        quantity: {
          type: Number,
        },
        orderStatus: {
          type: String,
          default: "Processing",
        },
        returnReason: {
          type: String,
        },
        // New fields for offer details
        offerType: {
          type: String,
        },
        offerTitle: {
          type: String,
        },
        offerPercentage: {
          type: Number,
        },
        offerAmount: {
          type: Number,
        },
        priceAfterOffer: {
          type: Number,
        },
        priceWithoutOffer: {
          type: Number,
        },
        CouponAmountOfItem: {
          type: Number,
        },
        priceAfterCoupon: {
          type: Number,
        },
        priceWithoutCoupon: {
          type: Number,
        },
        itemTotalPrice: {
          //total amount of that item  with or without offer and coupon
          type: Number,
        },
      },
    ],
    shippingAddress: {
      type: Object,
    },
    payment: {
      paymentMethod: {
        type: String,
      },
      paymentStatus: {
        type: String,
        enum: [
          "Pending",
          "Completed",
          "Failed",
          "Refunded",
          "Partially Refunded",
        ],
        default: "Pending",
      },
      razorpayOrderId: {
        type: String,
      },
      razorpayPaymentId: {
        type: String,
      },
    },
    couponCode: {
      type: String,
    },
    couponType: {
      type: String,
    },

    couponValue: {
      type: Number,
    },
    totalPrice: {
      type: Number, // Updated field for total price after discount and coupon
    },
    returnReason: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
