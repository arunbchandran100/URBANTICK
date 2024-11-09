const express = require("express");
const router = express.Router();

const publicUser = require("../controllers/userController");

router.get("/login", publicUser.login);

console.log(typeof publicUser.home);  

module.exports = router;