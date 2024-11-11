const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const User = require("../controllers/adminController");

router.get("/login", User.loginGET);
router.post("/login", User.loginPOST);

router.get("/dashboard", User.dashboardGET);
// router.post("/dashboard", User.dashboardPOST);

module.exports = router;
