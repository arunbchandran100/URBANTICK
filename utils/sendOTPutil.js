const nodemailer = require("nodemailer");
const crypto = require("crypto");


const transporter = nodemailer.createTransport({
  service: "Gmail",  
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.PASSWORD,  
  },
});


const generateOTP = () => {
  return crypto.randomBytes(3).toString("hex");  
};


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
