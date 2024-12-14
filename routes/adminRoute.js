const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const adminAuthenticated = require("../middleware/adminauthmildware");


router.use((req, res, next) => {
    req.session.admin = true;
    next();
});

// Admin login page
router.get("/login", adminController.getLogin);
router.post("/login", adminController.postLogin);

router.post("/logout", adminController.logout);

// Admin dashboard
router.get("/dashboard", adminAuthenticated,adminController.getDashboard);

// Admin  Customers
router.get("/customers", adminAuthenticated, adminController.getCustomers);
router.post("/customers/unblock/:id", adminController.unblockCustomer);
router.post("/customers/block/:id", adminController.blockCustomer);
router.post("/customers/updateStatus/:id", adminController.updateStatus);


// Admin  Category
router.get("/category", adminAuthenticated, adminController.getCategories);
router.post("/category/add", adminController.addCategory);
router.post("/category/update/:id", adminController.updateCategory);
router.post("/category/delete/:id", adminController.deleteCategory);

// product Routes
const adminProduct = require("../controllers/admin/adminProductController");

router.get("/products", adminAuthenticated, adminProduct.getProducts);
router.get("/products/add", adminProduct.getAddProduct);
router.post("/products/add", uploadMiddleware, adminProduct.postAddProduct);

// Admin edit products
router.get("/products/:id/details", adminAuthenticated, adminProduct.getProductDetails);
router.post("/products/update/:id", adminProduct.updateProductDetails);

// Admin edit Photo
router.get("/products/:id/image", adminAuthenticated, adminProduct.getEditProductImage);
router.post("/products/:id/image", uploadMiddleware, adminProduct.postEditProductImage);


router.post("/products/delete/:id", adminProduct.deleteProduct);

router.get("/products/add/variant",  adminAuthenticated,adminProduct.getAddvariant);
router.post("/products/add/variant", adminProduct.postAddvariant);
// router.post("/products/update/:id", adminProduct.updatevariant);
// router.post("/products/delete/:id", adminProduct.deletevariant);


// Admin Orders
const adminOrders = require("../controllers/admin/adminOrdersController");

router.get("/orders", adminAuthenticated, adminOrders.getAdminOrders);
router.get("/orders/details/:id",  adminAuthenticated, adminOrders.getAdminOrdersDetails);
router.post("/orders/update-status", adminOrders.updateOrderStatus);
router.post("/order/approve-return", adminOrders.handleReturnRequest);
router.post("/order/reject-return", adminOrders.handleReturnRequest);



// Admin Offer
const adminOffer = require("../controllers/admin/adminOfferController");

router.get("/offer", adminAuthenticated, adminOffer.getAdminOffers);
router.post("/offer/add", adminOffer.addOffer);
router.post("/offer/update", adminOffer.updateOffer);
router.delete("/offer/delete/:offerId", adminOffer.deleteOffer);

// Admin Coupon
const adminCoupon = require("../controllers/admin/adminCouponController");

router.get("/coupon", adminAuthenticated, adminCoupon.getAdminCoupon);
router.post("/coupon/add", adminCoupon.addCoupon);
router.post("/coupon/update", adminCoupon.updateCoupon);


// Admin Sales Report
const adminSalesReport = require("../controllers/admin/adminSalesReportController");

router.get("/salesreport", adminAuthenticated, adminSalesReport.getSalesReport);
router.get("/sales-report/pdf", adminSalesReport.downloadPDF);
router.get("/sales-report/excel", adminSalesReport.downloadExcel);


module.exports = router;
