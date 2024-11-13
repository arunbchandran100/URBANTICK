const userAuthenticated = require("../middleware/adminauthmildware");
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
  res.clearCookie("connect.sid"); // Clear session cookie manually
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
  res.clearCookie("connect.sid"); // Clear session cookie manually
};


///////////////////Dashboard-------------------
exports.getDashboard = [
  userAuthenticated,
  (req, res) => {
    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
    res.render("admin/adminDashboard"); // Render dashboard page
  },
];

  // 
///////////////////Dashboard Customers-------------------

// Fetch all customers
exports.getCustomers = [
  userAuthenticated,
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
  userAuthenticated,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const categories = await Category.find().skip(skip).limit(limit);
      const totalCategories = await Category.countDocuments();
      const totalPages = Math.ceil(totalCategories / limit);

      res.render("admin/adminCategory", {
        message: req.query.message || undefined, // Fetch message from query parameters
        categories,
        currentPage: page,
        totalPages,
      });
    } catch (err) {
      res.status(500).send("Error fetching categories");
    }
  },
];



exports.addCategory = async (req, res) => {
  try {
    // Convert the input to lowercase for case-insensitive comparison
    const categoryName = req.body.categoriesName.trim().toLowerCase();

    // Check if a category with the same name (case-insensitive) already exists
    const existingCategory = await Category.findOne({
      categoriesName: categoryName,
    });
    if (existingCategory) {
      const categories = await Category.find();
      const totalPages = Math.ceil((await Category.countDocuments()) / 10);
      return res.render("admin/adminCategory", {
        error: "Category already exists",
        categories,
        currentPage: 1, // Adjust based on the page the admin was on
        totalPages,
      });
    }

    // Create and save the new category with lowercase name
    const newCategory = new Category({
      categoriesName: categoryName,
    });

    await newCategory.save();
    res.redirect("/admin/category");
  } catch (err) {
    res.status(500).send("Error adding category");
  }
};


exports.updateCategory = async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, {
      categoriesName: req.body.categoriesName,
    });
    res.redirect("/admin/category");
  } catch (err) {
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
