const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
    {
        balance_amount: {
            type: Number,
            required: true,
            default: 0,
        },
        transactions: [
            {
                transactionType: {
                    type: String,
                    enum: ["DEBIT", "CREDIT"],
                    required: true,
                },
                amount: {
                    type: Number,
                    required: true,
                },
                transactionDate: {
                    type: Date,
                    required: true,
                    default: Date.now,
                },
            },
        ],
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

module.exports = mongoose.model("Wallet", walletSchema);
