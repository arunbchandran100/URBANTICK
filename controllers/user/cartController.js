const Variant = require("../../models/variantSchema");
const mongoose = require("mongoose");
const Cart = require("../../models/cartModel");
const Offer = require("../../models/offerModel");

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
      { color: variantId, productId: productId },
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
      return res
        .status(200)
        .json({ message: "Product is already in the cart." });
    } else {
      cartItem = new Cart({
        userId,
        productId,
        variantId: nvariantid,
        quantity,
      });
      await cartItem.save();
      res.status(200).json({ message: "Item added to cart successfully." });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// exports.getCart = async (req, res) => {
//   try {
//     const userId = req.session.user._id;

//     const cartItems = await Cart.find({ userId })
//       .populate("productId")
//       .populate("variantId");

//     const formattedCartItems = cartItems.map((item) => ({
//       _id: item._id,
//       product: item.productId,
//       variant: item.variantId,
//       quantity: item.variantId && item.variantId.stock > 0 ? item.quantity : 0,
//     }));

//     res.render("user/cart", { cartItems: formattedCartItems });
//   } catch (error) {
//     console.error("Error fetching cart items:", error);
//     res.status(500).send("Server Error");
//   }
// };

exports.getCart = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const offers = await Offer.find({ isActive: true });
    const cartItems = await Cart.find({ userId })
      .populate("productId")
      .populate("variantId");

    const formattedCartItems = cartItems.map((item) => {
      const product = item.productId;
      const discountPrice = item.variantId.discountPrice;
      const variant = item.variantId;

      let applicableOffers = [];
      let bestOffer = { discountPercentage: 0 };

      applicableOffers = offers.filter(
        (offer) =>
          offer.offerType === "Product" &&
          String(offer.applicableProduct) === String(product._id)
      );

      if (product.categoriesId) {
        const categoryOffers = offers.filter(
          (offer) =>
            offer.offerType === "Category" &&
            String(offer.applicableCategory) === String(product.categoriesId)
        );
        applicableOffers = applicableOffers.concat(categoryOffers);
      }

      if (applicableOffers.length > 0) {
        bestOffer = applicableOffers.reduce((max, current) =>
          current.discountPercentage > max.discountPercentage ? current : max
        );
      }

      const offerPercentage = bestOffer.discountPercentage || 0;
      const offerAmount = (discountPrice * offerPercentage) / 100;
      const afterOfferPrice = discountPrice - offerAmount;
      const offerType = bestOffer.offerType || null;
      const offerTitle = bestOffer.offerTitle || null;

      // Check if a coupon is applied
      const couponIsApplied = bestOffer.discountPercentage > 0;

      return {
        _id: item._id,
        product,
        variant,
        quantity: variant && variant.stock > 0 ? item.quantity : 0,
        offerPercentage,
        offerAmount,
        afterOfferPrice: afterOfferPrice > 0 ? afterOfferPrice : 0,
        offerType,
        offerTitle,
        couponIsApplied,
      };
    });

    console.log(formattedCartItems);
    res.render("user/cart", { cartItems: formattedCartItems });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).send("Server Error");
  }
};


exports.deleteFromCart = async (req, res) => {
  try {
    // console.log(22222222222222222);
    const cartItemId = req.params.id;
    const userId = req.session.user._id;

    // Find and delete the cart item
    const result = await Cart.findOneAndDelete({ _id: cartItemId, userId });

    if (result) {
      res.status(200).json({ message: "Item removed from cart" });
    } else {
      res.status(404).json({ message: "Item not found in cart" });
    }
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateCartQuantity = async (req, res) => {
  try {
    const cartItemId = req.params.id; // ID of the cart item
    const { quantity } = req.body; // New quantity from the client
    const userId = req.session.user._id; // Current user ID

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    } else if (quantity > 5) {
      return res
        .status(400)
        .json({ message: "Maximum quantity of 5 is allowed" });
    }

    // Find the cart item
    const cartItem = await Cart.findOne({ _id: cartItemId, userId }).populate(
      "variantId"
    );

    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Check the variant stock
    const variant = cartItem.variantId; // Populated variant document
    if (variant.stock < quantity) {
      return res
        .status(400)
        .json({ message: `Only ${variant.stock} items left in stock` });
    }

    // Update the quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({ message: "Cart updated successfully", cartItem });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Route to get stock for a specific variant
// exports.getVariantStock = async (req, res) => {
//   try {
//     console.log(89898989898);
//     const cartItemId = req.params.cartItemId;

//     // Find the variant by ID
//     const variant = await Variant.findById(cartItemId);
//     console.log(variant);
//     console.log(89998989);
//     console.log(variant.stock);
//     if (variant) {
//       res.status(200).json({ stock: variant.stock });
//     } else {
//       res.status(404).json({ message: "Variant not found" });
//     }
//   } catch (error) {
//     console.error("Error fetching variant stock:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
