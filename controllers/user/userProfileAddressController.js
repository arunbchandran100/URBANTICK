const adminAuthenticated = require("../../middleware/adminauthmildware");
require("dotenv").config();
const Product = require("../../models/productSchema");
const Variant = require("../../models/variantSchema");
const Category = require("../../models/categoryModel");
const User = require("../../models/userModel");
const mongoose = require("mongoose"); // Import mongoose
const Address = require("../../models/addressModel");



// -------------GET User Profile Page--------------------
exports.getPersonalInformation = async (req, res) => {
  try {
    // if (!req.session.user) {
    //   return res.redirect("/user/login");
    // }

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



// -----------GET User Addresses-------------------------
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

// -----------Add New Address-------------------------
exports.addAddress = async (req, res) => {
  try {
    // console.log(22222);
    const userId = req.session.user._id;

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

    if (!/^\d{10}$/.test(req.body.MobileNumber)) {
      return res.status(400).json({
        error: "Mobile number must be 10 digits",
      });
    }

    if (!/^\d{6}$/.test(req.body.pincode)) {
      return res.status(400).json({
        error: "Pincode must be 6 digits",
      });
    }

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

    await address.save();

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


// -----------Delete address-------------------------
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Address.findByIdAndDelete(id);

    // console.log("the result is " + result);
    if (result) {
      res.status(200).json({ message: "Address deleted successfully" });
    } else {
      res.status(404).json({ message: "Address not found" });
    }
  } catch (err) {
    console.error("Error deleting address:", err);
    res.status(500).json({ error: "Server error." });
  }
};



// Fetch a single address by ID
exports.getEditAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const address = await Address.findById(id);

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json(address); // Return address as JSON for the modal
    } catch (err) {
        console.error('Error fetching address:', err);
        res.status(500).json({ error: 'Failed to fetch address' });
    }
};


// Update the address
exports.updateAddress = async (req, res) => {
    try {
        const { id } = req.params; // Extract address ID from the route
        const updatedData = req.body; // Data from the modal form

        const updatedAddress = await Address.findByIdAndUpdate(
            id,
            updatedData,
            { new: true } // Return the updated document
        );

        if (!updatedAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json({ message: 'Address updated successfully', address: updatedAddress });
    } catch (err) {
        console.error('Error updating address:', err);
        res.status(500).json({ error: 'Failed to update address' });
    }
};
