const Wallet = require("../../models/walletModel");


exports.getWallet = async (req, res) => {
  try {
    const userId = req.session.user._id; // Assuming `user` is stored in the session

    // Check if the wallet exists
    let wallet = await Wallet.findOne({ userId }).lean();

    // If wallet doesn't exist, create one
    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance_amount: 0, // Default balance
        transactions: [], // No transactions initially
      });
    }

    const transactions = wallet.transactions || [];
    const balance = wallet.balance_amount;

    res.render("user/wallet", {
      balance,
      transactions,
    });
  } catch (error) {
    console.error("Error fetching or creating wallet:", error);
    res.status(500).json({ error: "Failed to fetch wallet details." });
  }
};
