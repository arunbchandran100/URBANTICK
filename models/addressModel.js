const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User collection
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    houseName: {
      type: String,
      required: true,
      trim: true,
    },
    localityStreet: {
      type: String,
      required: true,
      trim: true,
    },
    townCity: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => /^[0-9]{10}$/.test(v),
        message: "Mobile number must be 10 digits.",
      },
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => /^[0-9]{6}$/.test(v),
        message: "Pincode must be 6 digits.",
      },
    },
  },
  { timestamps: true }
); // Automatically adds createdAt and updatedAt fields

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
