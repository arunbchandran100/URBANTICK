const Order = require("../../models/orderModel");

exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, period } = req.query;

        // console.log(
        //     "Start date " + startDate + " End date " + endDate + " Period " + period
        // );
        const currentDate = new Date();
        let filter = {};

        if (period === "custom" && startDate && endDate) {
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
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
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
                case "yearly":
                    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
                    const endOfYear = new Date(currentDate.getFullYear() + 1, 0, 0);
                    filter.createdAt = {
                        $gte: startOfYear,
                        $lt: endOfYear,
                    };
                    break;
                default:
                    break;
            }
        }


        const orders = await Order.find(filter).lean();


        const filteredItems = orders.flatMap((order) =>
            order.orderItems
                .filter((item) =>
                    ["Delivered", "Return-Cancelled", "Return-Requested"].includes(
                        item.orderStatus
                    )
                )
                .map((item) => ({
                    ...item,
                    orderId: order._id,
                    userName: order.userName,
                    createdAt: order.createdAt,
                }))
        );


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
