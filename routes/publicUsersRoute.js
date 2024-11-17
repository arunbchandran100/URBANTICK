const express = require("express");
const router = express.Router();

const publicUser = require("../controllers/publicUserController");

router.get("/", publicUser.home);

module.exports = router;