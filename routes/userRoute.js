const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const User = require("../controllers/userController");

router.get("/login", User.loginGET);
router.post("/login",User.loginPOST)

router.get("/signup", User.signupGET);
router.post("/signup", User.signupPOST);


module.exports = router;