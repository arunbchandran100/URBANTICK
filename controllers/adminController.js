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
const SubCategory = require("../models/subCategoryModel");

exports.getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const categories = await Category.find().skip(skip).limit(limit);
    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    res.render("admin/adminCategory", {
      message: undefined,
      categories,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    res.status(500).send("Error fetching categories");
  }
};


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

///////////////////Dashboard Sub Category-------------------


exports.getSubCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const subCategories = await SubCategory.find()
      .populate("mainCategoryId")
      .skip(skip)
      .limit(limit);
    const totalSubCategories = await SubCategory.countDocuments();
    const totalSubPages = Math.ceil(totalSubCategories / limit);

    res.render("admin/adminCategory", {
      subCategories,
      currentSubPage: page,
      totalSubPages,
    });
  } catch (err) {
    res.status(500).send("Error fetching subcategories");
  }
};






// Fetch all categories
// exports.getCategories = async (req, res) => {
//   try {
//     const categories = await Category.find();
//     res.render("admin/adminCategory", { categories });
//   } catch (err) {
//     res.status(500).send("Error fetching categories");
//   }
// };







// Update an existing category




// Fetch all subcategories
// exports.getSubCategories = async (req, res) => {
//   try {
//     const subCategories = await SubCategory.find().populate("mainCategoryId");
//     res.render("admin/adminSubCategories", { subCategories });
//   } catch (err) {
//     res.status(500).send("Error fetching subcategories");
//   }
// };

// Add a new subcategory
exports.addSubCategory = async (req, res) => {
  try {
    const newSubCategory = new SubCategory({
      categoriesName: req.body.categoriesName,
      mainCategoryId: req.body.mainCategoryId,
    });
    await newSubCategory.save();
    res.redirect("/admin/subCategory");
  } catch (err) {
    res.status(500).send("Error adding subcategory");
  }
};


// Update an existing subcategory
exports.updateSubCategory = async (req, res) => {
  try {
    await SubCategory.findByIdAndUpdate(req.params.id, {
      categoriesName: req.body.categoriesName,
      mainCategoryId: req.body.mainCategoryId,
    });
    res.redirect("/admin/subCategory");
  } catch (err) {
    res.status(500).send("Error updating subcategory");
  }
};

// Delete a subcategory
exports.deleteSubCategory = async (req, res) => {
  try {
    await SubCategory.findByIdAndDelete(req.params.id);
    res.redirect("/admin/subCategory");
  } catch (err) {
    res.status(500).send("Error deleting subcategory");
  }
};
