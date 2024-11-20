const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const User = require("../controllers/userController");


// app.use(
//   session({
//     secret: "your-secret-key",
//     resave: false,
//     saveUninitialized: false,
//   })
// );


router.get("/user/login", User.loginGET);
router.post("/user/login", User.loginPOST);

router.get("/user/signup", User.signupGET);
router.post("/user/signup", User.signupPOST);
router.post("/user/verify-otp", User.verifyOTP);
router.post("/user/resend-otp", User.resendOTP);

router.get("/user/profile", User.getProfilePage);
router.post("/user/logout", User.logoutPOST);


router.get("/home", User.home);
router.get("/shopall", User.shopAll);
router.get("/product/:id", User.viewProduct);

module.exports = router;