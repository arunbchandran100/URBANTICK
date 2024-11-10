const express = require("express");
const router = express.Router();

const publicUser = require("../controllers/publicUserController");

router.get("/", publicUser.home);


console.log(typeof publicUser.home); // This should output 'function'


module.exports = router;