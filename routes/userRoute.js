const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const User = require("../controllers/userController");
const userProfileController = require("../controllers/user/userProfileAddressController");
const ShopAllController = require("../controllers/user/ShopAllController");


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


//--------------------Home Page --------------------
router.get("/home", User.home);


//--------------------SHOP ALL Page --------------------
router.get("/shopall", ShopAllController.shopAll);
router.get("/products/filter", ShopAllController.filterProducts);
router.get("/products/filter-options", ShopAllController.getFilterOptions);
router.get("/products/search", ShopAllController.searchProducts);




//--------------------View Product Page --------------------
router.get("/product/:id", User.viewProduct);
// Route to get variant details by color

router.get("/product/getcolor/variant", User.getVariantDetails);



//User Dashboard 
//-------------------- Personal info Dashboard --------------------
router.get("/user/profile", userProfileController.getPersonalInformation);
router.post("/user/profile", userProfileController.updatePersonalInformation);


//-------------------- Address info Dashboard --------------------
// Add address
router.post("/user/address/add", userProfileController.addAddress);

// Get all addresses
router.get("/user/address/:userId", userProfileController.getUserAddresses);

// Update an address
router.get("/user/address/edit/:id", userProfileController.getEditAddress);
router.post("/user/address/edit/:id", userProfileController.updateAddress);

// Delete an address
router.delete("/user/address/:id", userProfileController.deleteAddress);


//------------Cart---------------------------- 
const cartController = require("../controllers/user/cartController");


router.post("/cart/add", cartController.addToCart);
router.get("/shop/cart", cartController.getCart);
router.delete("/cart/:id", cartController.deleteFromCart);



module.exports = router;


