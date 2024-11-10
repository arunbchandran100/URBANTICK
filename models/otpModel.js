const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: { type: Date, default: Date.now, expires: "10m" }, // OTP expires in 10 minutes
});

const OTP = mongoose.model("OTP", otpSchema);

// Save OTP and user details temporarily
const saveOTP = async (email, otp) => {
  const newOTP = new OTP({ email, otp });
  await newOTP.save();
};

module.exports = {
  OTP,
  saveOTP,
};
