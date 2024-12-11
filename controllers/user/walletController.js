const Wallet = require("../../models/walletModel");


exports.getWallet = async (req, res) => {
  try {
    const userId = req.session.user._id; // Assuming `user` is stored in the session
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and 10 items per page

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

    const totalTransactions = wallet.transactions.length; // Total number of transactions
    const totalPages = Math.ceil(totalTransactions / limit); // Total number of pages

    // Paginate transactions
    const paginatedTransactions = wallet.transactions
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)) // Sort by date
      .slice((page - 1) * limit, page * limit); // Select transactions for the current page

    res.render("user/wallet", {
      balance: wallet.balance_amount,
      transactions: paginatedTransactions,
      currentPage: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching or creating wallet:", error);
    res.status(500).json({ error: "Failed to fetch wallet details." });
  }
};
