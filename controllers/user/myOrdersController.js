const Product = require("../../models/productSchema");
const Category = require("../../models/categoryModel");
const Variant = require("../../models/variantSchema");
const mongoose = require("mongoose"); 
const Cart = require("../../models/cartModel");


const Order = require("../../models/orderModel"); 


exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.session.user._id; 
    const page = parseInt(req.query.page) || 1;  
    const limit = 5;  
    const skip = (page - 1) * limit;  

     const totalOrders = await Order.countDocuments({ userId });
    const userOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

     const ordersWithDetails = userOrders.map((order) => ({
      _id: order._id,  
      orderDate: order.createdAt.toDateString(),  
      totalPrice: order.totalPrice,  
      paymentMethod: order.paymentMethod,  
      orderStatus: order.orderStatus,  
      items: order.orderItems.map((item) => ({
        productName: item.product.productName,  
        imageUrl: item.product.imageUrl,  
        color: item.variant.color,  
        price: item.variant.price, 
        quantity: item.quantity, 
      })),
    }));

    res.render("user/userMyOrders", {
      orders: ordersWithDetails,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
};
