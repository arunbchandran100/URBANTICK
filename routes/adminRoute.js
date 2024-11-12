const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");



// Admin login page
router.get("/login",adminController.getLogin);

// Handle admin login
router.post("/login", adminController.postLogin);

// Admin dashboard
router.get("/dashboard",  adminController.getDashboard);

// Logout admin
router.post("/logout", adminController.logout);

module.exports = router;
