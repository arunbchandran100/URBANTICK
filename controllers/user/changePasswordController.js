const User = require("../../models/userModel");
const bcrypt = require("bcrypt");


// exports.getChangePassword = async (req, res) => {
//     try {
//         res.render("user/changePassword");
//     } catch (err) {
//         console.error("Error rendering profile page:", err);
//         res.status(500).send("Server Error");
//     }
// };

// Render Change Password Page
exports.getChangePassword = async (req, res) => {
  try {
    const user = req.session.user; // Assume user is stored in session
    if (!user) {
      return res.redirect("/login"); // Redirect to login if user is not authenticated
    }
    res.render("user/changePassword", { user });
  } catch (err) {
    console.error("Error rendering change password page:", err);
    res.status(500).send("Server Error");
  }
};

// Handle Password Change
exports.postChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.session.user._id);

    // Check if user is authenticated
    if (!user) {
      return res.status(401).redirect("/login");
    }

    // If user has no password stored (Google login)
    if (!user.password) {
      return res.render("user/changePassword", {
        user,
        error:
          "You are logged in using Google. Password change not applicable.",
      });
    }

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.render("user/changePassword", {
        user,
        error: "Current password is incorrect.",
      });
    }

    // Validate new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.render("user/changePassword", {
        user,
        error: "New password and confirm password do not match.",
      });
    }

    // Hash and update the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.render("user/changePassword", {
      user,
      success: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).render("user/changePassword", {
      user: req.session.user,
      error: "An error occurred while changing the password.",
    });
  }
};
