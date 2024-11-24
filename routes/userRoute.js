const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const User = require("../controllers/userController");
const userProfileController = require("../controllers/user/userProfileAddressController");

// app.use(
//   session({
//     secret: "your-secret-key",
//     resave: false,
//     saveUninitialized: false,
//   })
// );

//--------------------user Login --------------------
router.get("/user/login", User.loginGET);
router.post("/user/login", User.loginPOST);

//--------------------user Signup --------------------
router.get("/user/signup", User.signupGET);
router.post("/user/signup", User.signupPOST);
router.post("/user/verify-otp", User.verifyOTP);
router.post("/user/resend-otp", User.resendOTP);

//--------------------User logout --------------------
router.post("/user/logout", userProfileController.logoutPOST);


//--------------------Public User Side --------------------
router.get("/home", User.home);
router.get("/shopall", User.shopAll);
router.get("/product/:id", User.viewProduct);


//User Dashboard 
//--------------------User Personal info Dashboard --------------------
router.get("/user/profile", userProfileController.getPersonalInformation);
router.post("/user/profile", userProfileController.updatePersonalInformation);


//--------------------User Address info Dashboard --------------------
// Add a new address
router.post("/user/address/add", userProfileController.addAddress);

// Get all addresses for a user
router.get("/user/address/:userId", userProfileController.getUserAddresses);



// // Update an address
// router.put("/user/address/:id", userProfileController.updateAddress);

// Delete an address
router.delete("/user/address/:id", userProfileController.deleteAddress);

module.exports = router;




module.exports = router;