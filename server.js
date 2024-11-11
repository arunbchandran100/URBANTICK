const express = require("express");
const app = express();
app.set("view engine", "ejs"); 
app.use(express.static("public"));
require("./models/mongodb");
const path = require("path");
require("dotenv").config();


// const session = require("express-session");
// const nocache = require("nocache");
// app.set("view engine", "ejs");
// const path = require("path");
// app.set("views", path.join(__dirname, "views"));

// app.use(nocache());

// app.use(
//   session({
//     secret: "password",
//     resave: false,
//     saveUninitialized: true,
//   })
// );

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 


const publicUsers = require("./routes/publicUsersRoute")
app.use("/", publicUsers)

const userRoute = require("./routes/userRoute");
app.use("/user", userRoute);

// const adminRoute = require("./routes/admin");
// app.use("/admin", adminRoute);


app.use(express.static(path.join(__dirname, "public")));


// const session = require("express-session");
// const passport = require("passport");
// const authRoutes = require("./routes/authRoutes"); // Adjust the path as needed
// require("./config/passport"); // Ensure Passport configuration is loaded





// Google login----------------------------------------------

require("dotenv").config();

const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;



app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

console.log(process.env.GOOGLE_CLIENT_ID)
console.log(process.env.GOOGLE_CLIENT_SECRET)

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.get("/", (req, res) => {
  res.send("<a href='/auth/google'>Login with Google</a>");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] ,prompt: 'select_account'})
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/profile");
  }
);

app.get("/profile", (req, res) => {
  res.send(`Welcome ${req.user.displayName}`);
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

app.listen(3000, () => {
  console.log(`Server is running at port 3000`);
});