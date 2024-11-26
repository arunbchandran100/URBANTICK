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
      },
    ],
    shippingAddress: {
      type: Object, 
    },
    paymentMethod: {
      type: String,  
    },
    totalPrice: { type: Number },

    orderStatus: {
      type: String,
      default: "Pending",  
    },
    returnReason: {
      type: String, 
    },
  },
  { timestamps: true }  
);

module.exports = mongoose.model("Order", orderSchema);
