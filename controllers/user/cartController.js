const Variant = require("../../models/variantSchema");
const mongoose = require("mongoose");
const Cart = require("../../models/cartModel");
const Offer = require("../../models/offerModel");

const getTotalQuantity = async (userId) => {
  try {
    const totalQuantity = await Cart.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) }, // Ensure the userId is in ObjectId format
      },
      {
        $group: {
          _id: null, // No specific grouping key needed
          totalQuantity: { $sum: "$quantity" }, // Sum the 'quantity' field
        },
      },
    ]);

    return totalQuantity[0]?.totalQuantity || 0;
  } catch (error) {
    console.error("Error calculating total quantity:", error);
    return 0; // Default to 0 if there's an error
  }
};



exports.addToCart = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const { productId, variantId, quantity } = req.body;

    if (!productId || !variantId || !quantity) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const nvariant = await Variant.findOne(
      { color: variantId, productId },
      { _id: 1 }
    );
    if (!nvariant) {
      throw new Error("Variant not found");
    }

    const nvariantid = nvariant._id;
    const userId = req.session.user._id;

    let cartItem = await Cart.findOne({
      userId,
      productId,
      variantId: nvariantid,
    });

    if (cartItem) {
      const totalQuantity = await getTotalQuantity(userId);
      return res.status(200).json({
        message: "Product is already in the cart.",
        cartQuantity: totalQuantity,
      });
    } else {
      cartItem = new Cart({
        userId,
        productId,
        variantId: nvariantid,
        quantity,
      });
      await cartItem.save();

      const totalQuantity = await getTotalQuantity(userId);
      return res.status(200).json({
        message: "Item added to cart successfully.",
        cartQuantity: totalQuantity,
      });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};



exports.getCart = async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Update expired offers
    let offers = await Offer.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    offers.forEach(async (offer) => {
      const offerEndDate = new Date(offer.endDate);
      if (offerEndDate < today) {
        offer.isActive = false;
        await offer.save();
      }
    });

    // Fetch active offers
    offers = await Offer.find({ isActive: true });

    const cartItems = await Cart.find({ userId })
      .populate("productId")
      .populate("variantId");

    let subtotal = 0;
    let totalDiscount = 0;

    const formattedCartItems = cartItems.map((item) => {
      const product = item.productId;
      const discountPrice = item.variantId.discountPrice;
      const variant = item.variantId;

      let applicableOffers = [];
      let bestOffer = { discountPercentage: 0 };

      // Find product-level offers
      applicableOffers = offers.filter(
        (offer) =>
          offer.offerType === "Product" &&
          String(offer.applicableProduct) === String(product._id)
      );

      // Find category-level offers if applicable
      if (product.categoriesId) {
        const categoryOffers = offers.filter(
          (offer) =>
            offer.offerType === "Category" &&
            String(offer.applicableCategory) === String(product.categoriesId)
        );
        applicableOffers = applicableOffers.concat(categoryOffers);
      }

      // Determine the best applicable offer
      if (applicableOffers.length > 0) {
        bestOffer = applicableOffers.reduce((max, current) =>
          current.discountPercentage > max.discountPercentage ? current : max
        );
      }

      const offerPercentage = bestOffer.discountPercentage || 0;
      const offerAmount = (discountPrice * offerPercentage) / 100;
      const afterOfferPrice = discountPrice - offerAmount;

      subtotal += discountPrice * item.quantity;
      totalDiscount += offerAmount * item.quantity;

      return {
        _id: item._id,
        product,
        variant,
        quantity: variant && variant.stock > 0 ? item.quantity : 0,
        offerPercentage,
        offerAmount,
        afterOfferPrice: afterOfferPrice > 0 ? afterOfferPrice : 0,
        offerType: bestOffer.offerType || null,
        offerTitle: bestOffer.title,
      };
    });

    const totalAfterDiscount = subtotal - totalDiscount;

    // Fetch total cart quantity
    const totalQuantity = await getTotalQuantity(userId);

    res.render("user/cart", {
      cartItems: formattedCartItems,
      subtotal,
      totalDiscount,
      totalAfterDiscount,
      cartQuantity: totalQuantity, // Pass total quantity to the frontend
    });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).send("Server Error");
  }
};



exports.deleteFromCart = async (req, res) => {
  try {
    const cartItemId = req.params.id;
    const userId = req.session.user._id;

    const result = await Cart.findOneAndDelete({ _id: cartItemId, userId });

    const totalQuantity = await getTotalQuantity(userId);

    if (result) {
      res.status(200).json({
        message: "Item removed from cart.",
        cartQuantity: totalQuantity,
      });
    } else {
      res.status(404).json({
        message: "Item not found in cart.",
        cartQuantity: totalQuantity,
      });
    }
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


exports.updateCartQuantity = async (req, res) => {
  try {
    const cartItemId = req.params.id;
    const { quantity } = req.body;
    const userId = req.session.user._id;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cartItem = await Cart.findOne({ _id: cartItemId, userId }).populate(
      "variantId"
    );

    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    const variant = cartItem.variantId;
    if (variant.stock < quantity) {
      return res.status(400).json({
        message: `Only ${variant.stock} items left in stock`,
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    const totalQuantity = await getTotalQuantity(userId);
    console.log(totalQuantity);
    res.status(200).json({
      message: "Cart updated successfully",
      cartItem,
      cartQuantity: totalQuantity,
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
