const collection = require("../models/mongodb");


///////////////////Home page/////////////////////
exports.home = (req, res) => {
    res.render('publicUser/home')
};
