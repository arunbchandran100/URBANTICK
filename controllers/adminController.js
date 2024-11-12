const userAuthenticated = require("../middleware/adminauthmildware");


exports.getLogin = (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin/adminLogin", { error: null });
  }
};


exports.postLogin = (req, res) => {
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


// exports.postLogin = (req, res) => {
//   if (
//     process.env.ADMIN_EMAIL === req.body.email &&
//     process.env.ADMIN_PASSWORD === req.body.password
//   ) {
//     req.session.admin = true;
//     res.redirect("/admin/dashboard");
//   } else {
//     return res.render("admin/adminLogin", {
//       error: "Wrong Admin email or password",
//     });
//   }
// };



exports.getDashboard = [
  userAuthenticated,
  (req, res) => {
    res.render("admin/adminDashboard"); // Render dashboard page
  },
];

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
};
