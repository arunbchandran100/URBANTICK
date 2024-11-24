const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users", // Reference to the User model
      required: true,
    },
    Name: { type: String, required: true },
    HouseName: { type: String, required: true },
    LocalityStreet: { type: String, required: true },
    TownCity: { type: String, required: true },
    MobileNumber: { type: Number, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: Number, required: true },
  },
  { timestamps: true }
);

const Address = mongoose.model("Address", addressSchema);
module.exports = Address;