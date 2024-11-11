const User = require("../models/userModel"); 
const bcrypt = require("bcryptjs");

// -------------User Login Page--------------------
exports.loginGET = (req, res) => {
  res.render("user/login");
};

// controllers/userController.js

exports.loginPOST = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("user/login", { error: "User not registered" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("user/login", { error: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful!" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};




// -------------User Signup Page--------------------
const { OTP, saveOTP } = require("../models/otpModel");
const nodemailer = require("nodemailer");
const { generateOTP, sendOTPEmail } = require("../utils/sendOTPutil");
const crypto = require("crypto");


exports.signupGET = (req, res) => {
  res.render("user/signup");
};

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use your email provider
  auth: {
    user: process.env.EMAIL, // Your email address
    pass: process.env.PASSWORD, // Your email password
  },
});






// Generate and send OTP, save OTP to database
exports.signupPOST = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const otp = generateOTP();
    console.log("first geberated otp is "+otp)
    await sendOTPEmail(email, otp);
    await saveOTP(email, otp);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



// Verify OTP and save user data to database
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, fullName, password } = req.body;
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const newUser = new User({ fullName, email, password });
    await newUser.save();

    await OTP.deleteOne({ email, otp });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: "Email is not registered" });
    }

    const newOtp = generateOTP();
    console.log("resend OTP is " + newOtp)
    otpRecord.otp = newOtp; // Update the OTP
    otpRecord.createdAt = Date.now(); // Update the createdAt timestamp
    await otpRecord.save();

    await sendOTPEmail(email, newOtp);

    res.status(200).json({ message: "OTP resent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};





