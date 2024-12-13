require("dotenv").config();
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("MongoDB is successfully connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

