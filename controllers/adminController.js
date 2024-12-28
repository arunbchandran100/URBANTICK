const adminAuthenticated = require("../middleware/adminauthmildware");
const User = require("../models/userModel");



///////////////////Admin Login-------------------
exports.getLogin = (req, res) => {
  if (req.session.admin) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin/adminLogin", { error: null });
  }
};


exports.postLogin = (req, res) => {
  res.clearCookie("connect.sid");
  if (
    process.env.ADMIN_EMAIL === req.body.email &&
    process.env.ADMIN_PASSWORD === req.body.password
  ) {
    req.session.admin = true;
    res.redirect("/admin/dashboard");
  } else {
    return res.render("admin/adminLogin", {
      error: "Wrong Admin email or password",
    });
  }
};


///////////////////Admin Logout-------------------
exports.logout = (req, res) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  req.session.destroy();
  res.redirect("/admin/login");
};


///////////////////Dashboard-------------------
const Order = require("../models/orderModel");

exports.getDashboard = (req, res) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.render("admin/adminDashboard");
};



const mongoose = require("mongoose");

exports.getDashboardData = async (req, res) => {
  try {
    const { filter } = req.query;

    // Get the earliest sale date
    const firstSale = await Order.findOne({}, { createdAt: 1 }).sort({
      createdAt: 1,
    });
    if (!firstSale) {
      return res.status(404).json({ message: "No sales data available." });
    }

    const startDate = new Date(firstSale.createdAt);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let groupBy;

    // Define grouping formats
    if (filter === "yearly") {
      groupBy = "%Y";
    } else if (filter === "monthly") {
      groupBy = "%Y-%m";
    } else if (filter === "weekly" || filter === "daily") {
      groupBy = "%Y-%m-%d";
    } else {
      return res.status(400).json({ message: "Invalid filter type." });
    }

    // Aggregate orders for sales graph
    const salesDataRaw = await Order.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lte: now } },
      },
      {
        $project: {
          orderItems: {
            $filter: {
              input: "$orderItems",
              as: "item",
              cond: {
                $in: [
                  "$$item.orderStatus",
                  ["Delivered", "Return-Cancelled", "Return-Requested"],
                ],
              },
            },
          },
          createdAt: 1,
        },
      },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy,
              date: "$createdAt",
            },
          },
          totalSales: { $sum: "$orderItems.itemTotalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Helper function to get week number of the month
    function getWeekOfMonth(date) {
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const firstWeekday = firstDayOfMonth.getDay();
      const offsetDate = date.getDate() + firstWeekday - 1;
      return Math.floor(offsetDate / 7) + 1;
    }

    // Helper function to get ordinal suffix
    function getWeekSuffix(num) {
      const j = num % 10;
      const k = num % 100;
      if (j == 1 && k != 11) {
        return "st";
      }
      if (j == 2 && k != 12) {
        return "nd";
      }
      if (j == 3 && k != 13) {
        return "rd";
      }
      return "th";
    }

    // Generate all possible intervals between the first sale and today
    const results = [];
    if (filter === "weekly") {
      const weeklyData = new Map();
      let current = new Date(startDate);

      while (current <= now) {
        const year = current.getFullYear();
        const month = current.getMonth() + 1;
        const weekNum = getWeekOfMonth(current);
        const weekLabel = `${weekNum}${getWeekSuffix(
          weekNum
        )} week of ${month}/${year}`;

        // Find the end of the week (Saturday)
        const weekEnd = new Date(current);
        while (weekEnd.getDay() !== 6 && weekEnd <= now) {
          weekEnd.setDate(weekEnd.getDate() + 1);
        }

        // Sum up sales for all days in this week
        let weekTotal = 0;
        const weekStart = new Date(current);
        while (weekStart <= weekEnd && weekStart <= now) {
          const dateStr = weekStart.toISOString().split("T")[0];
          const dailySales = salesDataRaw.find((d) => d._id === dateStr);
          if (dailySales) {
            weekTotal += dailySales.totalSales;
          }
          weekStart.setDate(weekStart.getDate() + 1);
        }

        if (!weeklyData.has(weekLabel)) {
          weeklyData.set(weekLabel, weekTotal);
        }

        // Move to next week
        current.setDate(current.getDate() + 7);
      }

      // Convert Map to array of objects
      weeklyData.forEach((totalSales, date) => {
        results.push({
          date,
          totalSales,
        });
      });
    } else {
      // Handle yearly, monthly, and daily filters
      const dateIntervals = [];
      let current = new Date(startDate);

      while (current <= now) {
        let dateLabel;

        if (filter === "yearly") {
          dateLabel = `${current.getFullYear()}`;
          current.setFullYear(current.getFullYear() + 1);
        } else if (filter === "monthly") {
          dateLabel = `${current.getFullYear()}-${(current.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`;
          current.setMonth(current.getMonth() + 1);
        } else if (filter === "daily") {
          dateLabel = current.toISOString().split("T")[0];
          current.setDate(current.getDate() + 1);
        }

        dateIntervals.push(dateLabel);
      }

      const salesMap = Object.fromEntries(
        salesDataRaw.map((d) => [d._id, d.totalSales])
      );

      dateIntervals.forEach((interval) => {
        results.push({
          date: interval,
          totalSales: salesMap[interval] || 0,
        });
      });
    }

    // Aggregate top 10 products
    const topProducts = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.orderStatus": {
            $in: ["Delivered", "Return-Cancelled", "Return-Requested"],
          },
        },
      },
      {
        $group: {
          _id: "$orderItems.product.productName",
          totalQuantity: { $sum: "$orderItems.quantity" },
          totalRevenue: { $sum: "$orderItems.itemTotalPrice" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    // Aggregate top 10 categories
    const topCategories = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.orderStatus": {
            $in: ["Delivered", "Return-Cancelled", "Return-Requested"],
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.categoriesId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$categoryDetails.categoriesName",
          totalQuantity: { $sum: "$orderItems.quantity" },
          totalRevenue: { $sum: "$orderItems.itemTotalPrice" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    // Aggregate top 10 brands
    const topBrands = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.orderStatus": {
            $in: ["Delivered", "Return-Cancelled", "Return-Requested"],
          },
        },
      },
      {
        $group: {
          _id: "$orderItems.product.brand",
          totalQuantity: { $sum: "$orderItems.quantity" },
          totalRevenue: { $sum: "$orderItems.itemTotalPrice" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      salesData: results,
      topProducts,
      topCategories,
      topBrands,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data." });
  }
};







///////////////////Dashboard Customers-------------------

exports.getCustomers = [
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 12;
      const skip = (page - 1) * limit;

      const customers = await User.find().skip(skip).limit(limit);
      const totalCustomers = await User.countDocuments();
      const totalPages = Math.ceil(totalCustomers / limit);

      res.render("admin/adminCustomers", {
        customers,
        currentPage: page,
        totalPages,
      });
    } catch (err) {
      res.status(500).send("Error fetching customers");
    }
  },
];


// Unblock a customer
exports.unblockCustomer = [
  async (req, res) => {
    try {
      const customerId = req.params.id;
      await User.findByIdAndUpdate(customerId, { status: "active" });
      res.redirect("/admin/customers");
    } catch (err) {
      res.status(500).send("Error unblocking customer");
    }
  },
];

// Block a customer
exports.blockCustomer = [
  async (req, res) => {
    try {
      const customerId = req.params.id;
      await User.findByIdAndUpdate(customerId, { status: "blocked" });
      res.redirect("/admin/customers");
    } catch (err) {
      res.status(500).send("Error blocking customer");
    }
  },
];


exports.updateStatus = [
  async (req, res) => {
    try {
      const customerId = req.params.id;
      const status = req.body.status;

      await User.findByIdAndUpdate(customerId, { status });

      res.json({ success: true });
    } catch (err) {
      res.json({ success: false, message: "Error updating status" });
    }
  },
];



///////////////////Dashboard Category-------------------
const Category = require("../models/categoryModel");

exports.getCategories = [
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const categories = await Category.find().skip(skip).limit(limit);
      const totalCategories = await Category.countDocuments();
      const totalPages = Math.ceil(totalCategories / limit);

      res.render("admin/adminCategory", {
        message: req.query.message || undefined,
        categories,
        currentPage: page,
        totalPages,
      });
    } catch (err) {
      res.status(500).send("Error fetching categories");
    }
  },
];



exports.addCategory = [
  async (req, res) => {
    try {
      const lowerCategoryName = req.body.categoriesName.trim().toLowerCase();
      const categoryName =
        lowerCategoryName.charAt(0).toUpperCase() + lowerCategoryName.slice(1);

      // Validate the category name
      if (!categoryName || categoryName.trim() === "") {
        return res.render("admin/adminCategory", {
          error: "Category name cannot be empty or just spaces.",
          categories: await Category.find(),
          currentPage: 1,
          totalPages: Math.ceil((await Category.countDocuments()) / 10),
        });
      }

      const containsAlphabets = /[a-zA-Z]/.test(categoryName);
      if (!containsAlphabets) {
        return res.render("admin/adminCategory", {
          error:
            "Category name must include at least one alphabetic character.",
          categories: await Category.find(),
          currentPage: 1,
          totalPages: Math.ceil((await Category.countDocuments()) / 10),
        });
      }

      // Check if the category already exists
      const existingCategory = await Category.findOne({
        categoriesName: categoryName,
      });
      if (existingCategory) {
        return res.render("admin/adminCategory", {
          error: "Category already exists.",
          categories: await Category.find(),
          currentPage: 1,
          totalPages: Math.ceil((await Category.countDocuments()) / 10),
        });
      }

      // Add the new category
      const newCategory = new Category({
        categoriesName: categoryName,
      });
      await newCategory.save();

      res.redirect("/admin/category");
    } catch (err) {
      console.error("Error adding category:", err);
      res.status(500).send("Error adding category");
    }
  },
];



exports.updateCategory = async (req, res) => {
  try {
    const lowerCategoryName = req.body.categoriesName.trim().toLowerCase();
    const categoriesName =
      lowerCategoryName.charAt(0).toUpperCase() + lowerCategoryName.slice(1);

    // Validate the category name
    if (!categoriesName || categoriesName.trim() === "") {
      return res.status(400).render("admin/adminCategory", {
        error: "Category name cannot be empty or just spaces.",
        categories: await Category.find(),
        currentPage: 1,
        totalPages: Math.ceil((await Category.countDocuments()) / 10),
      });
    }

    const containsAlphabets = /[a-zA-Z]/.test(categoriesName);
    if (!containsAlphabets) {
      return res.status(400).render("admin/adminCategory", {
        error: "Category name must include at least one alphabetic character.",
        categories: await Category.find(),
        currentPage: 1,
        totalPages: Math.ceil((await Category.countDocuments()) / 10),
      });
    }

    // Update the category
    await Category.findByIdAndUpdate(req.params.id, {
      categoriesName,
    });

    res.redirect("/admin/category");
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).send("Error updating category");
  }
};


// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect("/admin/category");
  } catch (err) {
    res.status(500).send("Error deleting category");
  }
};
