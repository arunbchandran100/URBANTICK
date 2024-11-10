const User = require("../models/userModel"); // Import the User model
// const bcrypt = require("bcryptjs"); // Import bcrypt to hash passwords
///////////////////User Login page/////////////////////
exports.loginGET = (req, res) => {
  res.render("user/login");
};

exports.signupGET = (req, res) => {
  res.render("user/signup");
};

// controllers/userController.js

// Signup
exports.signupPOST = async (req, res) => {

  // Check if user already exists
  try {
    const { fullName, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }


    // Create a new user
    const newUser = new User({
      fullName,
      email,
      password,
    });

    // Save user to database
    await newUser.save();

    // Send response
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
