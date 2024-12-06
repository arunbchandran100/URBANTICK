const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
        unique: true,
    },
    couponType: {
        type: String,
        enum: ["percentage", "flat"],
        required: true,
    },
    couponValue: {
        type: Number,
        required: true,
    },
    minimumPurchaseAmount: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    perUserUsageLimit: {
        type: Number,
        required: true,
        min: 1,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});

module.exports = mongoose.model("Coupon", couponSchema);
