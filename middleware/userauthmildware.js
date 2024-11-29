// const User = require("./models/User"); // Adjust the path as necessary

// module.exports = (req, res, next) => {
//   console.log(req.session);
//   if (req.session.user) {
//     next();
//   } else {
//     res.redirect("/user/login");
//   }
// };


const User = require("../models/userModel"); // Adjust the path as necessary

module.exports = async (req, res, next) => {
  if (req.session.user) {
    // Find the user in the database to check their status
    const user = await User.findById(req.session.user._id);

    if (user && user.status === "active") {
      next();
    } else {
      console.log("User is blocked");
      res.redirect("/user/login");
    }
  } else {
    res.redirect("/user/login");
  }
};
