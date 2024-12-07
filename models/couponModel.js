const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
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
        usageByUser: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                count: {
                    type: Number,
                    default: 0,
                },
            },
        ],
    },
    { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);

 module.exports =Coupon