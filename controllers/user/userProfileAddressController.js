const adminAuthenticated = require("../../middleware/adminauthmildware");
require("dotenv").config();
const Product = require("../../models/productSchema");
const Variant = require("../../models/variantSchema");
const Category = require("../../models/categoryModel");
const User = require("../../models/userModel"); 




// -------------User Profile Page--------------------
// const User = require("../models/User");

exports.getPersonalInformation = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/user/login");
    }

    // Fetch user details
    const user = await User.findById(req.session.user._id).select(
      "fullName email mobile"
    );

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Render the profile page with the user details
    res.render("user/profile", { user });
  } catch (err) {
    console.error("Error rendering profile page:", err);
    res.status(500).send("Server Error");
  }
};




exports.updatePersonalInformation = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    const { fullName, mobile } = req.body;


    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      { fullName, mobile },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("Error updating user details:", err);
    res.status(500).json({ error: "Server Error" });
  }
};



exports.logoutPOST = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return res.status(500).send("Failed to logout. Please try again.");
      }
      res.redirect("/home");
    });
  } catch (error) {
    console.error("Error in logoutPOST:", error);
    res.status(500).send("Server error during logout.");
  }
};


