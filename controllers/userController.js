const collection = require("../models/mongodb");

///////////////////User Login page/////////////////////
exports.login = (req, res) => {
    
  res.render("user/login");
};
