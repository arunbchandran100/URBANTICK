const Order = require("../../models/orderModel");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, period } = req.query;

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
                    orderId: item.order_id,
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


// Utility function to calculate date range
const getDateRange = (range, startDate, endDate) => {
    const currentDate = new Date();
    let dateRange = { start: new Date(), end: new Date() };

    const currentYear = currentDate.getFullYear(); // Get current year

    switch (range) {
        case "custom":
            dateRange.start = new Date(startDate);
            dateRange.end = new Date(endDate);
            break;
        case "daily":
            dateRange.start = new Date(currentDate.setHours(0, 0, 0, 0));
            dateRange.end = new Date(currentDate.setHours(23, 59, 59, 999));
            break;
        case "weekly":
            // Get the start of the week (Sunday)
            const startOfWeek = new Date(
                currentDate.setDate(currentDate.getDate() - currentDate.getDay())
            );
            // Include today as part of the week
            dateRange.start = new Date(startOfWeek.setHours(0, 0, 0, 0));
            dateRange.end = new Date(startOfWeek.setDate(startOfWeek.getDate() + 7));
            break;
        case "monthly":
            dateRange.start = new Date(currentYear, currentDate.getMonth(), 1);
            dateRange.end = new Date(currentYear, currentDate.getMonth() + 1, 0);
            break;
        case "yearly":
            dateRange.start = new Date(currentYear, 0, 1); // Start of the year (January 1st)
            dateRange.end = new Date(currentYear, 11, 31); // End of the year (December 31st)
            break;
        default:
            throw new Error("Invalid range");
    }

    return dateRange;
};

// Generate PDF report
exports.downloadPDF = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        const dateRange = getDateRange(range, startDate, endDate);

        const orders = await Order.find({
            createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        }).lean();

        const filteredItems = orders.flatMap((order) =>
            order.orderItems
                .filter((item) =>
                    ["Delivered", "Return-Cancelled", "Return-Requested"].includes(
                        item.orderStatus
                    )
                )
                .map((item) => ({
                    ...item,
                    orderId: item.order_id,
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

        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=sales_report.pdf"
        );

        doc.pipe(res);

        doc.fontSize(18).text("Sales Report", { align: "center" });
        doc.moveDown();
        doc
            .fontSize(12)
            .text(
                `Date Range: ${dateRange.start.toDateString()} - ${dateRange.end.toDateString()}`,
                { align: "center" }
            );
        doc.moveDown();

        // Sales summary
        doc
            .font("Helvetica-Bold")
            .fontSize(14)
            .text("Summary:", { underline: true });
        doc.font("Helvetica").fontSize(12);
        doc.text(`Total Items Sold: ${reportData.totalItemsSold}`);
        doc.text(
            `Total Order Amount: ₹${reportData.totalOrderAmount.toFixed(2)}`
        );
        doc.text(`Total Offer: ₹${reportData.totalOffer.toFixed(2)}`);
        doc.text(
            `Total Coupon Deduction: ₹${reportData.totalCouponDeduction.toFixed(2)}`
        );
        doc.moveDown();

        // Table header
        doc.font("Helvetica-Bold");
        doc.text("Order ID", 50, 240);
        doc.text("User Name", 130, 240);
        doc.text("Product", 240, 240);
        doc.text("Quantity", 350, 240);
        doc.text("Price", 420, 240);
        doc.text("Date", 490, 240, { width: 80, align: "center" });

        // Table rows
        let currentTop = 260;
        filteredItems.forEach((item) => {
            doc.font("Helvetica").text(item.orderId, 50, currentTop);
            doc.text(item.userName, 130, currentTop);
            doc.text(
                `${item.product.brand} - ${item.product.productName}`,
                240,
                currentTop,
                { width: 100, ellipsis: true }
            );
            doc.text(item.quantity, 350, currentTop, {
                width: 80,
                align: "center",
            });
            doc.text(item.itemTotalPrice.toFixed(2), 420, currentTop);
            doc.text(
                new Date(item.createdAt).toLocaleDateString("en-US"),
                500,
                currentTop,
                { width: 80, align: "center" }
            );
            currentTop += 20;


            if (currentTop > 700) {
                doc.addPage();
                currentTop = 50;
            }
        });

        doc.end();
    } catch (error) {
        console.error("Error generating PDF report:", error);
        res.status(500).json({ message: "Error generating PDF report" });
    }
};


// Generate Excel report
exports.downloadExcel = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        const dateRange = getDateRange(range, startDate, endDate);

        const orders = await Order.find({
            createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        }).lean();

        const filteredItems = orders.flatMap((order) =>
            order.orderItems
                .filter((item) =>
                    ["Delivered", "Return-Cancelled", "Return-Requested"].includes(
                        item.orderStatus
                    )
                )
                .map((item) => ({
                    ...item,
                    orderId: item.order_id,
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

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sales Report");

        worksheet.columns = [
            { header: "Order ID", key: "orderId", width: 20 },
            { header: "User Name", key: "userName", width: 20 },
            { header: "Product", key: "product", width: 30 },
            { header: "Quantity", key: "quantity", width: 10 },
            { header: "Price", key: "price", width: 15 },
            { header: "Date", key: "date", width: 15 },
        ];

        worksheet.addRow([]);

        worksheet.addRow([
            `Date Range: ${dateRange.start.toDateString()} - ${dateRange.end.toDateString()}`
        ]);
        // Add summary
        worksheet.addRow([]);
        worksheet.addRow(["Summary"]);
        worksheet.addRow(["Total Items Sold", reportData.totalItemsSold.toFixed()]);
        worksheet.addRow([
            "Total Order Amount",
            `₹${reportData.totalOrderAmount.toFixed(2)}`,
        ]);
        worksheet.addRow(["Total Offer", `₹${reportData.totalOffer.toFixed(2)}`]);
        worksheet.addRow([
            "Total Coupon Deduction",
            `₹${reportData.totalCouponDeduction.toFixed(2)}`,
        ]);
        worksheet.addRow([]);

        // Add data
        filteredItems.forEach((item) => {
            worksheet.addRow({
                orderId: item.orderId,
                userName: item.userName,
                product: `${item.product.brand} - ${item.product.productName}`,
                quantity: item.quantity.toFixed(),
                price: item.itemTotalPrice.toFixed(2),
                date: new Date(item.createdAt).toLocaleDateString("en-US"),
            });
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=sales_report.xlsx"
        );
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error generating Excel report:", error);
        res.status(500).json({ message: "Error generating Excel report" });
    }
};
