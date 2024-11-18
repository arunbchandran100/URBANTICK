const express = require("express");
const router = express.Router();

const publicUser = require("../controllers/publicUserController");

router.get("/home", publicUser.home);

router.get("/shopall", publicUser.shopAll);
router.get("/product/:id", publicUser.viewProduct);


module.exports = router;