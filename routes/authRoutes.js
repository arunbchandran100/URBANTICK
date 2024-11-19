const express = require("express");
const passport = require("passport");
const { OAuth2Client } = require("google-auth-library");
const router = express.Router();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);
const User = require("../models/userModel")


// POST route to handle Google OAuth login
router.post("/auth/google", async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, name, email } = payload;

    let user = await User.findOne({ googleId: sub });
    if (!user) {
      user = new User({
        googleId: sub,
        fullName: name,
        email: email,
      });
      await user.save();
    }

    req.login(user, (err) => {
      if (err) return res.status(500).send(err);
      res.status(200).send("Login successful");
    });
  } catch (error) {
    res.status(401).send("Unauthorized");
  }
});

// GET route to handle Google OAuth callback
// router.get(
//   "/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/" }),
//   (req, res) => {
//     // Successful authentication
//     res.redirect("/dashboard");
//   }
// );

module.exports = router;
