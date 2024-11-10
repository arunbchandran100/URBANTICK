const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const publicUser = require("../controllers/userController");

router.get("/login", publicUser.login);
router.get("/signup", publicUser.signup);

// Add validation for signup
router.post(
  "/signup",
  [
    body("fullName")
      .isAlpha("en-US", { ignore: " " })
      .withMessage("Full Name should only contain letters"),
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password")
      .isLength({ min: 8, max: 16 })
      .withMessage("Password must be 8-16 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain a lowercase letter")
      .matches(/\d/)
      .withMessage("Password must contain a number")
      .matches(/[!@#\$%\^\&*\)\(+=._-]/)
      .withMessage("Password must contain a special character"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return validation errors as JSON response
      return res.status(400).json({ errors: errors.array() });
    }

    // If validations pass, add signup logic here
    res.json({ message: "Signup successful!" });
  }
);

module.exports = router;
