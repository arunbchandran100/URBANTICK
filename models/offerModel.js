const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        discountPercentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        offerType: {
            type: String,
            enum: ["Product", "Category"],
            required: true,
        },
        applicableProduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: function () {
                return this.offerType === "Product";
            }, // Required if offerType is 'Product'
        },
        applicableCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: function () {
                return this.offerType === "Category";
            }, // Required if offerType is 'Category'
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Offer", offerSchema);
