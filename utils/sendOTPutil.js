const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail", // Use your email provider
  auth: {
    user: process.env.EMAIL, // Your email address
    pass: process.env.PASSWORD, // Your email password
  },
});

// Generate OTP
const generateOTP = () => {
  return crypto.randomBytes(3).toString("hex"); // Generates a 6-digit OTP
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`,
      
    });
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

module.exports = { generateOTP, sendOTPEmail };
