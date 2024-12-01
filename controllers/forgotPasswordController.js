const { OTP, saveOTP } = require("../models/otpModel");
const nodemailer = require("nodemailer");
const { generateOTP, sendOTPEmail } = require("../utils/sendOTPutil");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const userAuthenticated = require("../middleware/userauthmildware");

exports.getForgotPassword = (req, res) => {
  res.render("user/forgotPassword");
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// Handle sending OTP
exports.sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const userExists = await User.findOne({ email });

    if (!userExists) {
      return res.status(400).json({ message: "Email is not registered" });
    }

    const otp = generateOTP();
    console.log("Forgot Password OTP: " + otp);
    await sendOTPEmail(email, otp);
    await saveOTP(email, otp);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Handle OTP verification
exports.verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await OTP.deleteOne({ email, otp });
    res
      .status(200)
      .json({ message: "OTP verified. You can now reset your password." });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Handle password reset
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Handle OTP resend
exports.resendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email is registered
    const userExists = await User.findOne({ email });
    if (!userExists) {
      return res.status(400).json({ message: "Email is not registered" });
    }

    // Check if OTP record exists
    let otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      otpRecord = new OTP({ email });
    }

    // Generate a new OTP
    const newOtp = generateOTP();
    otpRecord.otp = newOtp;
    otpRecord.createdAt = Date.now();
    await otpRecord.save();

    // Send the new OTP via email
    await sendOTPEmail(email, newOtp);
    console.log("Resent OTP: " + newOtp);

    res.status(200).json({ message: "OTP resent to your email" });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Server error while resending OTP" });
  }
};
