exports.placeOrder = async (req, res) => {
  try {
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

    const userId = req.session.user._id;
    const { selectedAddress, paymentMethod, appliedCouponCode } = req.body;

    console.log(paymentMethod);
    if (!selectedAddress || !paymentMethod) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const shippingAddress = await Address.findById(selectedAddress);
    if (!shippingAddress) {
      return res.status(404).json({ error: "Invalid address selected" });
    }

    const cartItems = await Cart.find({ userId })
      .populate("productId")
      .populate("variantId");

    if (!cartItems.length) {
      return res.status(400).json({ error: "Your cart is empty" });
    }

    offers = await Offer.find({ isActive: true });

    let subtotal = 0;
    let totalPrice = 0;

    // Calculate items with offer prices
    const orderItems = cartItems.map((item) => {
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
      const priceAfterOffer = discountPrice - offerAmount;
      const itemTotalPrice = priceAfterOffer * item.quantity;

      subtotal += itemTotalPrice;

      return {
        orderId: new mongoose.Types.ObjectId(),
        product: {
          productId: item.productId._id,
          brand: item.productId.brand,
          productName: item.productId.productName,
          imageUrl: item.productId.imageUrl[0],
        },
        variant: {
          variantId: item.variantId._id,
          color: item.variantId.color,
          discountPrice: item.variantId.discountPrice,
        },
        quantity: item.quantity,
        orderStatus: "Processing",
        offerType: bestOffer.offerType || null,
        offerTitle: bestOffer.title || null,
        offerPercentage,
        offerAmount,
        priceAfterOffer,
        priceWithoutOffer: item.variantId.discountPrice,
        itemTotalPrice, // Total price of the item after applying offers
        priceWithoutCoupon: itemTotalPrice,
        CouponAmountOfItem: 0, // Will be calculated below
        priceAfterCoupon: itemTotalPrice, // Will be updated below
      };
    });

    // Check and apply the coupon
    let couponDiscount = 0;
    let coupon;
    if (appliedCouponCode) {
      coupon = await Coupon.findOne({
        couponCode: appliedCouponCode,
        isActive: true,
      });

      if (!coupon) {
        return res.status(400).json({ error: "Invalid or expired coupon" });
      }

      if (subtotal < coupon.minimumPurchaseAmount) {
        return res.status(400).json({
          error: `Minimum purchase amount for this coupon is ${coupon.minimumPurchaseAmount}`,
        });
      }

      const userUsage = coupon.usageByUser.find(
        (usage) => String(usage.userId) === String(userId)
      );
      const userUsageCount = userUsage ? userUsage.count : 0;

      if (userUsageCount >= coupon.perUserUsageLimit) {
        return res
          .status(400)
          .json({ error: "Coupon usage limit reached for this user" });
      }

      if (coupon.couponType === "percentage") {
        couponDiscount = (subtotal * coupon.couponValue) / 100;
      } else if (coupon.couponType === "flat") {
        couponDiscount = coupon.couponValue;
      }

      couponDiscount = Math.min(couponDiscount, subtotal); // Ensure the discount doesn't exceed the subtotal

      // Update the coupon usage
      if (userUsage) {
        userUsage.count += 1;
      } else {
        coupon.usageByUser.push({ userId, count: 1 });
      }

      await coupon.save();
    }

    // Distribute coupon discount among items based on their weightage
    const totalItemPrice = orderItems.reduce(
      (sum, item) => sum + item.itemTotalPrice,
      0
    );

    orderItems.forEach((item) => {
      const itemWeightage = item.itemTotalPrice / totalItemPrice;
      const couponAmountOfItem = couponDiscount * itemWeightage;
      item.CouponAmountOfItem = couponAmountOfItem;
      item.priceAfterCoupon = item.itemTotalPrice - couponAmountOfItem;
    });

    totalPrice = subtotal - couponDiscount;
    orderItems.forEach((item) => {
      item.itemTotalPrice = item.priceAfterCoupon;
    });
    //payment.paymentMethod = paymentMethod;
    const newOrder = new Order({
      userId,
      userName: req.session.user.fullName,
      orderItems,
      shippingAddress,
      paymentMethod,
      couponCode: appliedCouponCode || null,
      couponType: couponDiscount ? coupon.couponType : null,
      couponValue: couponDiscount || null,
      totalPrice,
    });

    // Update itemTotalPrice to match priceAfterCoupon for all items



    
    // Update stock for each item
    for (const item of cartItems) {
      const variant = await ProductVariant.findById(item.variantId._id);
      if (variant.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: "Insufficient stock for some items" });
      }
      variant.stock -= item.quantity;
      await variant.save();
    }
    console.log(44444444);
    await newOrder.save();
    // Clear the user's cart
    await Cart.deleteMany({ userId });
    console.log(555555555555555);
    console.log(newOrder);
    res.status(200).json({
      success: true,
      message: "Order placed successfully!",
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res
      .status(500)
      .json({ error: "An error occurred while placing the order" });
  }
};

