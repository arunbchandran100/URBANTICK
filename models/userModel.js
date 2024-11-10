const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the user schema
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash the password if it's new or modified

  try {
    // Hash the password using bcrypt with salt rounds
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create a User model
const User = mongoose.model("User", userSchema);

module.exports = User;
