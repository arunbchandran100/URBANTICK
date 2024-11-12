const userAuthenticated = require("../middleware/adminauthmildware");


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

exports.logout = (req, res) => {
  res.setHeader(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate"
        );
  req.session.destroy();
  res.redirect("/admin/login");
  res.clearCookie("connect.sid"); // Clear session cookie manually
};
