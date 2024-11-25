module.exports = (req, res, next) => {
  console.log(req.session);
  if (req.session.user) {
    next();
  } else {
    res.redirect("/user/login");
  }
};
