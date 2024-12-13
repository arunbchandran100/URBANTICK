const Order = require("../../models/orderModel");
const Variant = require("../../models/variantSchema");
const Category = require("../../models/categoryModel");
const Product = require("../../models/productSchema");
const Offer = require("../../models/offerModel");
const Coupon = require("../../models/couponModel");

exports.getSalesReport = async (req, res) => {
    try {
        res.render("admin/adminSalesReport");
    } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).send("An error occurred while fetching coupons.");
    }
};
