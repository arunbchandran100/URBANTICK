const userAuthenticated = require("../middleware/adminauthmildware");
const User = require("../models/userModel");


///////////////////Dashboard-------------------
exports.getDashboard = [
  userAuthenticated,
  (req, res) => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.render("admin/adminDashboard");  
  },
];
