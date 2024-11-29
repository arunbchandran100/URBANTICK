const adminAuthenticated = require("../../middleware/adminauthmildware");

const Order = require("../../models/orderModel");
const User = require("../../models/userModel");
const Variant = require("../../models/variantSchema");


exports.getAdminOrders = [
  adminAuthenticated,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const totalOrders = await Order.countDocuments();
      const orders = await Order.find()
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 })
        .lean(); // Use lean() to get plain JavaScript objects

      orders.forEach((order) => {
        if (order.orderItems.length > 0) {
          order.computedOrderStatus = order.orderItems[0].orderStatus; 
        } else {
          order.computedOrderStatus = "No Items";
        }
      });

      const totalPages = Math.ceil(totalOrders / limit);

      res.render("admin/adminOrders", {
        orders,
        currentPage: page,
        totalPages,
      });
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ error: "Failed to fetch admin orders" });
    }
  },
];




exports.getAdminOrdersDetails = [
  adminAuthenticated,  
  async (req, res) => {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);

      if (!order) {
        return res
          .status(404)
          .render("admin/404", { message: "Order not found" });
      }

      const mappedOrder = {
        _id: order._id,
        userName: order.userName,
        orderDate: order.createdAt,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        shippingAddress: order.shippingAddress,
        items: order.orderItems, 
      };

      res.render("admin/adminOrdersDetails", { order: mappedOrder });
    } catch (error) {
      console.error("Error fetching admin order details:", error);
      res.status(500).json({ error: "Failed to fetch admin order details" });
    }
  },
];



exports.updateOrderStatus = [
  adminAuthenticated,
  async (req, res) => {
    try {
      console.log(222222222);
      const { itemId, orderId, orderStatus } = req.body;

      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const item = order.orderItems.id(itemId);
      if (!item) return res.status(404).json({ error: "Item not found" });

      item.orderStatus = orderStatus;
      await order.save();

      
      if (orderStatus === "Cancelled") {
        const variant = await Variant.findById(item.variant.variantId);
        if (!variant) {
          return res
            .status(404)
            .json({ error: "Associated variant not found" });
        }

        variant.stock += item.quantity;
        await variant.save();
      }

      item.orderStatus = orderStatus;
      await order.save();

      res.status(200).json({ message: "Order status updated successfully" });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  },
];
