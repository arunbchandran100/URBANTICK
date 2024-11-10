const User = require("../models/userModel"); 
const bcrypt = require("bcryptjs");

// -------------User Login Page--------------------
exports.loginGET = (req, res) => {
  res.render("user/login");
};

exports.loginPOST = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful!" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



// -------------User Signup Page--------------------
exports.signupGET = (req, res) => {
  res.render("user/signup");
};

exports.signupPOST = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({
      fullName,
      email,
      password,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
