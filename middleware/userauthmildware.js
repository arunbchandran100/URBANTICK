const User = require("../models/userModel");  

module.exports = async (req, res, next) => {
  if (req.session.user) {

    const user = await User.findById(req.session.user._id);

    if (user && user.status === "active") {
      next();
    } else {
          req.session.destroy((err) => {
            if (err) {
              console.error("Error during logout:", err);
              return res
                .status(500)
                .send("Failed to logout. Please try again.");
            }
            res.redirect("/user/login");
          });
    }
  } else {
    res.redirect("/user/login");
  }
};
