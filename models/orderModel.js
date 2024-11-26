const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
    },
    products: [
      {
        productDetails: {
          type: Object, // Store all product and variant details (e.g., productName, price, color, etc.)
        },
        quantity: {
          type: Number,
        },
        order_id: {
          type: String, // Unique order ID for each product
          default: () =>
            `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        },
      },
    ],
    address: {
      type: Object, // Store the entire address object
    },
    paymentMode: {
      type: String, // Payment method (e.g., "COD", "Credit Card")
    },
    orderStatus: {
      type: String,
      default: "Pending", // Possible statuses: Pending, Shipped, Delivered, Cancelled
    },
    returnReason: {
      type: String, // Reason for return (optional)
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("Order", orderSchema);
