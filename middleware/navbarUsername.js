// middleware/userMiddleware.js
const userMiddleware = (req, res, next) => {
  res.locals.user = req.session.user || null; // Attach user session data to res.locals
  next();
};

module.exports = userMiddleware;
