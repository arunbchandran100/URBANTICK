const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  categoriesName: {
    type: String,
    required: true,
    unique: true,
    index: {
      unique: true,
      collation: { locale: "en", strength: 2 },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index with collation for case insensitivity
categorySchema.index(
  { categoriesName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
