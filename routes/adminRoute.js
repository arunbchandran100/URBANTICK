const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const uploadMiddleware = require("../middleware/uploadMiddleware");

router.use((req, res, next) => {
    req.session.admin = true;
    next();
});

// Admin login page
router.get("/login", adminController.getLogin);
router.post("/login", adminController.postLogin);

router.post("/logout", adminController.logout);

// Admin dashboard
router.get("/dashboard", adminController.getDashboard);

// Admin  Customers
router.get("/customers", adminController.getCustomers);
router.post("/customers/unblock/:id", adminController.unblockCustomer);
router.post("/customers/block/:id", adminController.blockCustomer);
router.post("/customers/updateStatus/:id", adminController.updateStatus);

router.get("/category", adminController.getCategories);
router.post("/category/add", adminController.addCategory);
router.post("/category/update/:id", adminController.updateCategory);
router.post("/category/delete/:id", adminController.deleteCategory);

// product Routes
const adminProduct = require("../controllers/admin/adminProductController");

router.get("/products", adminProduct.getProducts);
router.get("/products/add", adminProduct.getAddProduct);
router.post("/products/add", uploadMiddleware, adminProduct.postAddProduct);

// Admin edit products
router.get("/products/:id/details", adminProduct.getProductDetails);
router.post("/products/update/:id", adminProduct.updateProductDetails);

// Admin edit Photo
router.get("/products/:id/image", adminProduct.getEditProductImage);
router.post("/products/:id/image", uploadMiddleware, adminProduct.postEditProductImage);


router.post("/products/delete/:id", adminProduct.deleteProduct);

router.get("/products/add/variant", adminProduct.getAddvariant);
router.post("/products/add/variant", adminProduct.postAddvariant);
// router.post("/products/update/:id", adminProduct.updatevariant);
// router.post("/products/delete/:id", adminProduct.deletevariant);

// Admin Orders
const adminOrders = require("../controllers/admin/adminOrdersController");

router.get("/orders", adminOrders.getAdminOrders);
router.get("/orders/details/:id", adminOrders.getAdminOrdersDetails);
router.post("/orders/update-status", adminOrders.updateOrderStatus);



module.exports = router;
