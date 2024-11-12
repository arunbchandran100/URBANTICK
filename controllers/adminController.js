const userAuthenticated = require("../middleware/adminauthmildware");

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

  // userAuthenticated,
///////////////////Dashboard Customers-------------------
const User = require("../models/userModel");  // Assuming you have a Customer model

// Fetch all customers
exports.getCustomers = [
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; // Get the page number from the query params, default to 1
      const limit = 12; // Number of customers to display per page
      const skip = (page - 1) * limit; // Calculate how many documents to skip

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
      await Customer.findByIdAndUpdate(customerId, { status: "active" });
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
      await Customer.findByIdAndUpdate(customerId, { status: "blocked" });
      res.redirect("/admin/customers");
    } catch (err) {
      res.status(500).send("Error blocking customer");
    }
  },
];


