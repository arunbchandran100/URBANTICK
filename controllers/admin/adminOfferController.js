const Order = require("../../models/orderModel");
const Variant = require("../../models/variantSchema");
const Category = require("../../models/categoryModel");
const Product = require("../../models/productSchema");
const Offer = require("../../models/offerModel");



exports.getAdminOffers = async (req, res) => {
    try {
        const ITEMS_PER_PAGE = 5; // Define how many offers to display per page
        const page = parseInt(req.query.page, 10) || 1;

        // Fetch offers with pagination
        const totalOffers = await Offer.countDocuments();
        const offers = await Offer.find()
            .populate("applicableProduct", "productName") // Populate product details
            .populate("applicableCategory", "categoriesName") // Populate category details
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

        // Fetch all products and categories for the dropdowns
        const products = await Product.find({}, "productName");
        const categories = await Category.find({}, "categoriesName");
        console.log(products);
        //   console.log(categoriesName);

        res.render("admin/adminOffer", {
            offers,
            products,
            categories,
            currentPage: page,
            totalPages: Math.ceil(totalOffers / ITEMS_PER_PAGE),
        });
    } catch (error) {
        console.error("Error fetching offers:", error);
        res.status(500).send("An error occurred while fetching offers.");
    }
};



// POST: Add Offer
exports.addOffer = async (req, res) => {
  try {
    const {
      title,
      discountPercentage,
      offerType,
      applicableTo,
      startDate,
      endDate,
      isActive,
    } = req.body;

    // Validate inputs
    if (
      !title ||
      !discountPercentage ||
      !offerType ||
      !applicableTo ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if startDate is before endDate
    if (new Date(startDate) >= new Date(endDate)) {
      return res
        .status(400)
        .json({ message: "Start date must be before the end date." });
    }

    // Create a new offer
    const newOffer = new Offer({
      title,
      discountPercentage,
      offerType,
      applicableProduct: offerType === "Product" ? applicableTo : null,
      applicableCategory: offerType === "Category" ? applicableTo : null,
      startDate,
      endDate,
      isActive: isActive === "on", // Checkbox returns 'on' if checked
    });

    // Save the offer
    await newOffer.save();

    // Redirect to admin offers page or respond with success
    res.redirect("/admin/offer"); // Replace with your route for listing offers
  } catch (error) {
    console.error("Error adding offer:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

