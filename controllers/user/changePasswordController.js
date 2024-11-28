const User = require("../../models/userModel");
const bcrypt = require("bcrypt");



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


exports.postChangePassword = async (req, res) => {
    try {
        console.log(222222222);
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = await User.findById(req.session.user._id);
        console.log(user);


        if (!user) {
            console.error("No user found.");
            return res.status(401).redirect("/login");
        }


        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res
                .status(401)
                .json({ message: "Current password is incorrect." });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Send success response
        return res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("Error changing password:", error);

        // Send error response
        return res
            .status(500)
            .json({ message: "An error occurred while changing the password." });
    }
};
