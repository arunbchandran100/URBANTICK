const Order = require("../../models/orderModel");
const Variant = require("../../models/variantSchema");
const Category = require("../../models/categoryModel");
const Product = require("../../models/productSchema");
const Offer = require("../../models/offerModel");
const Coupon = require("../../models/couponModel");

exports.getAdminCoupon = async (req, res) => {
    try {
        // Retrieve pagination parameters from the request
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = 5; // Number of coupons to show per page
        const skip = (page - 1) * limit;

        // Fetch coupons from the database with pagination
        const [coupons, totalCoupons] = await Promise.all([
            Coupon.find().skip(skip).limit(limit),
            Coupon.countDocuments(),
        ]);

        const totalPages = Math.ceil(totalCoupons / limit);

        res.render("admin/adminCoupon", {
            coupons, // Pass fetched coupons
            currentPage: page, // Current page
            totalPages, // Total number of pages
        });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).send("An error occurred while fetching coupons.");
    }
};




exports.addCoupon = async (req, res) => {
    try {
        // Extract form data
        const {
            couponCode,
            couponType,
            couponValue,
            minimumPurchaseAmount,
            startDate,
            endDate,
            perUserUsageLimit,
            isActive,
        } = req.body;

        // Validate the coupon value based on the coupon type
        if (couponType === "percentage") {
            if (couponValue < 0 || couponValue > 100) {
                return res
                    .status(400)
                    .json({ message: "Discount percentage must be between 0 and 100." });
            }
        } else if (couponType === "flat" && couponValue < 0) {
            return res
                .status(400)
                .json({ message: "Flat discount amount cannot be negative." });
        }

        // Validate the start and end dates
        if (new Date(startDate) > new Date(endDate)) {
            return res
                .status(400)
                .json({ message: "Start date cannot be after end date." });
        }

        // Validate that the end date is not in the past
        if (new Date(endDate) < new Date()) {
            return res
                .status(400)
                .json({ message: "End date cannot be in the past." });
        }

        // Create a new coupon
        const newCoupon = new Coupon({
            couponCode,
            couponType,
            couponValue,
            minimumPurchaseAmount,
            startDate,
            endDate,
            perUserUsageLimit,
            isActive: isActive === "on", // Convert checkbox value to boolean
        });

        // Save to the database
        await newCoupon.save();

        // Redirect to the coupon management page with success message
        res.redirect("/admin/coupon");
    } catch (error) {
        console.error("Error adding coupon:", error);
        // Handle unique constraint or validation errors gracefully
        if (error.code === 11000) {
            return res.status(400).json({ message: "Coupon code must be unique." });
        }
        res
            .status(500)
            .json({ message: "An error occurred while adding the coupon." });
    }
};

exports.updateCoupon = async (req, res) => {
    try {
        // Extract form data
        const {
            couponId,
            couponCode,
            couponType,
            couponValue,
            minimumPurchaseAmount,
            startDate,
            endDate,
            perUserUsageLimit,
            isActive,
        } = req.body;

        // Find the coupon by ID
        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found." });
        }

        // Validate the coupon value based on the coupon type
        if (couponType === "percentage") {
            if (couponValue < 0 || couponValue > 100) {
                return res
                    .status(400)
                    .json({ message: "Discount percentage must be between 0 and 100." });
            }
        } else if (couponType === "flat" && couponValue < 0) {
            return res
                .status(400)
                .json({ message: "Flat discount amount cannot be negative." });
        }

        // Validate the start and end dates
        if (new Date(startDate) > new Date(endDate)) {
            return res
                .status(400)
                .json({ message: "Start date cannot be after end date." });
        }

        // Validate that the end date is not in the past
        if (new Date(endDate) < new Date()) {
            return res
                .status(400)
                .json({ message: "End date cannot be in the past." });
        }

        // Update coupon data
        coupon.couponCode = couponCode;
        coupon.couponType = couponType;
        coupon.couponValue = couponValue;
        coupon.minimumPurchaseAmount = minimumPurchaseAmount;
        coupon.startDate = startDate;
        coupon.endDate = endDate;
        coupon.perUserUsageLimit = perUserUsageLimit;
        coupon.isActive = isActive === "on"; // Convert checkbox value to boolean

        // Save the updated coupon
        await coupon.save();

        // Redirect to the coupon management page with success message
        res.redirect("/admin/coupon");
    } catch (error) {
        console.error("Error updating coupon:", error);
        res
            .status(500)
            .json({ message: "An error occurred while updating the coupon." });
    }
};



// exports.addCoupon = async (req, res) => {
//     try {
//         // Extract form data
//         const {
//             couponCode,
//             couponType,
//             couponValue,
//             minimumPurchaseAmount,
//             startDate,
//             endDate,
//             perUserUsageLimit,
//             isActive,
//         } = req.body;

//         // Validate the start and end dates
//         if (new Date(startDate) > new Date(endDate)) {
//             return res.status(400).send("Start date cannot be after end date.");
//         }

//         // Create a new coupon
//         const newCoupon = new Coupon({
//             couponCode,
//             couponType,
//             couponValue,
//             minimumPurchaseAmount,
//             startDate,
//             endDate,
//             perUserUsageLimit,
//             isActive: isActive === "on", // Convert checkbox value to boolean
//         });

//         // Save to the database
//         await newCoupon.save();

//         // Redirect to the coupon management page with success message
//         res.redirect("/admin/coupon");
//     } catch (error) {
//         console.error("Error adding coupon:", error);
//         // Handle unique constraint or validation errors gracefully
//         if (error.code === 11000) {
//             return res.status(400).send("Coupon code must be unique.");
//         }
//         res.status(500).send("An error occurred while adding the coupon.");
//     }
// };

// exports.updateCoupon = async (req, res) => {
//     try {
//         // Extract form data
//         const {
//             couponId,
//             couponCode,
//             couponType,
//             couponValue,
//             minimumPurchaseAmount,
//             startDate,
//             endDate,
//             perUserUsageLimit,
//             isActive,
//         } = req.body;

//         // Find the coupon by ID
//         const coupon = await Coupon.findById(couponId);

//         if (!coupon) {
//             return res.status(404).send("Coupon not found.");
//         }

//         // Validate start and end dates
//         if (new Date(startDate) > new Date(endDate)) {
//             return res.status(400).send("Start date cannot be after end date.");
//         }

//         // Update coupon data
//         coupon.couponCode = couponCode;
//         coupon.couponType = couponType;
//         coupon.couponValue = couponValue;
//         coupon.minimumPurchaseAmount = minimumPurchaseAmount;
//         coupon.startDate = startDate;
//         coupon.endDate = endDate;
//         coupon.perUserUsageLimit = perUserUsageLimit;
//         coupon.isActive = isActive === "on"; // Convert checkbox value to boolean

//         // Save the updated coupon
//         await coupon.save();

//         // Redirect to the coupon management page with a success message
//         res.redirect("/admin/coupon");
//     } catch (error) {
//         console.error("Error updating coupon:", error);
//         res.status(500).send("An error occurred while updating the coupon.");
//     }
// };
