require("dotenv").config();
const express = require("express");
const app = express();
const passport = require("passport");
const session = require("express-session");
const mongoose = require("mongoose");
const User = require("./models/userModel");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const path = require("path");

app.set("view engine", "ejs");
app.use(express.static("public"));
require("./models/mongodb");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicUsers = require("./routes/publicUsersRoute");
app.use("/", publicUsers);

const userRoute = require("./routes/userRoute");
app.use("/user", userRoute);

// ---------------------------Google login---------------------

// require("dotenv").config();

// const passport = require("passport");
// const session = require("express-session");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;

// app.use(
//   session({
//     secret: "secret",
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// app.use(passport.initialize());
// app.use(passport.session());

// // console.log(process.env.GOOGLE_CLIENT_ID)
// // console.log(process.env.GOOGLE_CLIENT_SECRET)

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:3000/auth/google/callback",
//     },
//     (accessToken, refreshToken, profile, done) => {
//       return done(null, profile);
//     }
//   )
// );

// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((user, done) => done(null, user));

// app.get("/", (req, res) => {
//   res.send("<a href='/auth/google'>Login with Google</a>");
// });

// app.get(
//   "/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"] ,prompt: 'select_account'})
// );

// app.get(
//   "/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/" }),
//   (req, res) => {
//     res.redirect("/profile");
//   }
// );

// app.get("/profile", (req, res) => {
//   res.send(`Welcome ${req.user.displayName}`);
// });

// app.get("/logout", (req, res) => {
//   req.logout(() => {
//     res.redirect("/");
//   });
// });

// app.listen(3000, () => {
//   console.log(`Server is running at port 3000`);
// });

// server.js

app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({
            googleId: profile.id,
            fullName: profile.displayName,
            email: profile.emails[0].value,
          });
          await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);



passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err, null));
});


app.get("/", (req, res) => {
  res.send("<a href='/auth/google'>Login with Google</a>");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/profile");
  }
);

app.get("/profile", (req, res) => {
  res.send(`Welcome ${req.user.fullName}`);
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

app.listen(3000, () => {
  console.log(`Server is running at port 3000`);
});
