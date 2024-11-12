const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");


// Admin login page
router.get("/login",adminController.getLogin);
router.post("/login", adminController.postLogin);

// Logout admin
router.post("/logout", adminController.logout);

// Admin dashboard
router.get("/dashboard",  adminController.getDashboard);


// Admin  Customers
router.get("/customers", adminController.getCustomers);
router.post("/customers/unblock/:id", adminController.unblockCustomer);
router.post("/customers/block/:id", adminController.blockCustomer);
router.post("/customers/updateStatus/:id", adminController.updateStatus);


// Admin  Products
router.get("/category", adminController.getCategory);


module.exports = router;
