const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  color: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, required: true },
  discountPercentage: { type: Number, required: true },
  rating: { type: Number, required: true },
});

const Variant = mongoose.model("Variant", variantSchema);
module.exports = Variant;
