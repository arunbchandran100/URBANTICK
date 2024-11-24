const adminAuthenticated = require("../../middleware/adminauthmildware");
require("dotenv").config();
const Product = require("../../models/productSchema");
const Variant = require("../../models/variantSchema");
const Category = require("../../models/categoryModel");
const User = require("../../models/userModel"); 




// -------------GET User Profile Page--------------------
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



// -------------POST User Profile Page--------------------
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



// -------------User Logout--------------------
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

const mongoose = require("mongoose"); // Import mongoose

const Address = require("../../models/addressModel");

// Add a new address
// Address Controller

exports.getUserAddresses = async (req, res) => {
  try {
    // Get userId from session
    const userId = req.session.user._id;

    // console.log("userId is " + userId);
    // Fetch addresses for the user
    const addresses = await Address.find({ userId }).sort({ createdAt: -1 });

    // console.log("addresses are " + addresses);
    // Render address page with data
    res.render("user/address", {
      addresses,
      user: req.session.user,
      error: null,
      success: null,
    });
  } catch (err) {
    console.error("Error in getUserAddresses:", err);
    res.render("user/address", {
      addresses: [],
      user: req.session.user,
      error: "Failed to fetch addresses",
      success: null,
    });
  }
};





// Add new address
exports.addAddress = async (req, res) => {
  try {
    console.log(22222);
    // Get userId from session
    const userId = req.session.user._id;

    // Validate required fields
    const requiredFields = [
      "Name",
      "HouseName",
      "LocalityStreet",
      "TownCity",
      "MobileNumber",
      "state",
      "country",
      "pincode",
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          error: `${field} is required`,
        });
      }
    }

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(req.body.MobileNumber)) {
      return res.status(400).json({
        error: "Mobile number must be 10 digits",
      });
    }

    // Validate pincode (6 digits)
    if (!/^\d{6}$/.test(req.body.pincode)) {
      return res.status(400).json({
        error: "Pincode must be 6 digits",
      });
    }

    // Create new address
    const address = new Address({
      userId,
      Name: req.body.Name,
      HouseName: req.body.HouseName,
      LocalityStreet: req.body.LocalityStreet,
      TownCity: req.body.TownCity,
      MobileNumber: Number(req.body.MobileNumber),
      state: req.body.state,
      country: req.body.country,
      pincode: Number(req.body.pincode),
    });

    // Save address to database
    await address.save();

    // Send success response
    res.status(201).json({
      message: "Address added successfully",
      address,
    });
  } catch (err) {
    console.error("Error in addAddress:", err);
    res.status(500).json({
      error: "Failed to add address",
      details: err.message,
    });
  }
};


