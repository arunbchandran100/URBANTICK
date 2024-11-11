const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

// -------------Admin Login Page--------------------
exports.loginGET = (req, res) => {
  res.render("admin/adminLogin");
};

// controllers/userController.js

exports.loginPOST = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("user/userLogin", { error: "User not registered" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("user/userLogin", { error: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful!" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// -------------------Admin Dashboard-----------------
exports.dashboardGET = (req, res) => {
  res.render("admin/adminDashboard");
};

