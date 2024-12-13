const Order = require("../../models/orderModel");

exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, period } = req.query;


        const currentDate = new Date();
        let filter = {};

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        } else {
            switch (period) {
                case "daily":
                    filter.createdAt = {
                        $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
                        $lt: new Date(currentDate.setHours(23, 59, 59, 999)),
                    };
                    break;
                case "weekly":
                    const startOfWeek = new Date(
                        currentDate.setDate(currentDate.getDate() - currentDate.getDay())
                    );
                    const endOfWeek = new Date(
                        currentDate.setDate(startOfWeek.getDate() + 6)
                    );
                    filter.createdAt = {
                        $gte: startOfWeek,
                        $lt: endOfWeek,
                    };
                    break;
                case "monthly":
                    const startOfMonth = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        1
                    );
                    const endOfMonth = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        0
                    );
                    filter.createdAt = {
                        $gte: startOfMonth,
                        $lt: endOfMonth,
                    };
                    break;
                default:
                    break;
            }
        }

        // Fetch orders matching the filter
        const orders = await Order.find(filter).lean();

        // Flatten order items and filter by the required statuses
        const filteredItems = orders.flatMap((order) =>
            order.orderItems
                .filter((item) =>
                    ["Delivered", "Return-Cancelled", "Return-Requested"].includes(
                        item.orderStatus
                    )
                )
                .map((item) => ({
                    ...item,
                    orderId: order._id, // Attach order ID for reference
                    userName: order.userName, // Attach user details for reference
                    createdAt: order.createdAt,
                }))
        );

        // Aggregate sales report data
        const reportData = filteredItems.reduce(
            (acc, item) => {
                acc.totalItemsSold += item.quantity;
                acc.totalOrderAmount += item.itemTotalPrice;
                acc.totalOffer += item.offerAmount * item.quantity;
                acc.totalCouponDeduction += item.CouponAmountOfItem || 0;
                return acc;
            },
            {
                totalItemsSold: 0,
                totalOrderAmount: 0,
                totalOffer: 0,
                totalCouponDeduction: 0,
            }
        );

        res.render("admin/adminSalesReport", {
            items: filteredItems,
            reportData,
            period,
            startDate,
            endDate,
        });
    } catch (error) {
        console.error("Error generating sales report:", error);
        res.status(500).json({ error: "Failed to generate sales report" });
    }
};
