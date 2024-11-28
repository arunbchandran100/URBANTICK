const adminAuthenticated = require("../../middleware/adminauthmildware");

//---------------GET Admin orders----------------------
// exports.getAdminOrders = [
//   adminAuthenticated,
//   async (req, res) => {
//     try {
      
//       res.render("admin/adminOrders");
//     } catch (error) {
//       console.error("Error fetching product details:", error);
//       res.status(500).json({ error: "Failed to fetch product details" });
//     }
//   },
// ];

// Import necessary models
const Order = require("../../models/orderModel");
const User = require("../../models/userModel");

// Admin Orders Controller
exports.getAdminOrders = [
  adminAuthenticated, // Middleware to verify admin access
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 12; // Limit orders per page
      const skip = (page - 1) * limit;

      // Fetch orders with pagination
      const totalOrders = await Order.countDocuments();
      const orders = await Order.find()
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email") // Populate user details
        .sort({ createdAt: -1 });

      const totalPages = Math.ceil(totalOrders / limit);

      res.render("admin/adminOrders", {
        orders,
        currentPage: page,
        totalPages,
      });
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ error: "Failed to fetch admin orders" });
    }
  },
];
