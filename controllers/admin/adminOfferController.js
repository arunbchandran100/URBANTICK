const Order = require("../../models/orderModel");
const Variant = require("../../models/variantSchema");
const Category = require("../../models/categoryModel");
const Product = require("../../models/productSchema");
const Offer = require("../../models/offerModel");



exports.getAdminOffers = async (req, res) => {
    try {
        // For Setting the expired offer to FALSE
        let offers = await Offer.find();

        let today = new Date();
        today.setHours(0, 0, 0, 0);

        offers.forEach(async (offer) => {
            const offerEndDate = new Date(offer.endDate);
            if (offerEndDate < today) {
                offer.isActive = false;

                await offer.save();
            }
        });

        const ITEMS_PER_PAGE = 5; // Define how many offers to display per page
        const page = parseInt(req.query.page, 10) || 1;

        // Fetch offers with pagination
        const totalOffers = await Offer.countDocuments();
        offers = await Offer.find()
            .populate("applicableProduct") // Populate product details
            .populate("applicableCategory") // Populate category details
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

        // console.log(offers);

        // Fetch all products and categories for the dropdowns
        const products = await Product.find({}, "productName");
        const categories = await Category.find({}, "categoriesName");
        // console.log(55226633);
        // console.log(products);
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


        if (discountPercentage < 0 || discountPercentage > 100) {
            return res
                .status(400)
                .json({ message: "Discount percentage must be between 0 and 100." });
        }


        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
            return res.status(400).json({ message: "Invalid date format." });
        }


        if (parsedStartDate >= parsedEndDate) {
            return res
                .status(400)
                .json({ message: "Start date must be before the end date." });
        }


        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedEndDate < today) {
            return res
                .status(400)
                .json({ message: "End date cannot be in the past." });
        }


        const existingOffer = await Offer.findOne({
            isActive: true,
            $or: [
                { applicableProduct: applicableTo },
                { applicableCategory: applicableTo },
            ],
        });

        if (existingOffer) {
            return res
                .status(400)
                .json({
                    message:
                        "There is already an active offer for this product or category.",
                });
        }




        const newOffer = new Offer({
            title,
            discountPercentage,
            offerType,
            applicableProduct: offerType === "Product" ? applicableTo : null,
            applicableCategory: offerType === "Category" ? applicableTo : null,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            isActive: isActive === "on",
        });

        await newOffer.save();


        res.redirect("/admin/offer");
    } catch (error) {
        console.error("Error adding offer:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};





// POST: Update Offer
exports.updateOffer = async (req, res) => {
    try {
        // For Setting the expired offer to FALSE
        const offers = await Offer.find();

        let today = new Date();
        today.setHours(0, 0, 0, 0);

        offers.forEach(async (offer) => {
            const offerEndDate = new Date(offer.endDate);
            if (offerEndDate < today) {
                offer.isActive = false;

                await offer.save();
            }
        });

        const {
            offerId,
            title,
            discountPercentage,
            offerType,
            applicableTo,
            startDate,
            endDate,
            isActive,
        } = req.body;

        if (
            !offerId ||
            !title ||
            !discountPercentage ||
            !offerType ||
            !applicableTo ||
            !startDate ||
            !endDate
        ) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Ensure the discount percentage is within range
        if (discountPercentage < 0 || discountPercentage > 100) {
            return res
                .status(400)
                .json({ message: "Discount percentage must be between 0 and 100." });
        }

        // Validate date formats
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
            return res.status(400).json({ message: "Invalid date format." });
        }

        // Check if startDate is before endDate
        if (parsedStartDate >= parsedEndDate) {
            return res
                .status(400)
                .json({ message: "Start date must be before the end date." });
        }

        // Check if the end date is not in the past
        today = new Date();
        today.setHours(0, 0, 0, 0); // Clear time for date-only comparison
        if (parsedEndDate < today) {
            return res
                .status(400)
                .json({ message: "End date cannot be in the past." });
        }

        // Check if there is an active offer for the same product or category, excluding the current offer
        const existingOffer = await Offer.findOne({
            isActive: true,
            $or: [
                { applicableProduct: applicableTo },
                { applicableCategory: applicableTo },
            ],
            _id: { $ne: offerId },
        });

        if (existingOffer) {
            return res.status(400).json({
                message:
                    "There is already an active offer for this product or category.",
            });
        }

        // Update the offer
        const updatedOffer = await Offer.findByIdAndUpdate(
            offerId,
            {
                title,
                discountPercentage,
                offerType,
                applicableProduct: offerType === "Product" ? applicableTo : null,
                applicableCategory: offerType === "Category" ? applicableTo : null,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                isActive: isActive === "on",
            },
            { new: true }
        );

        if (!updatedOffer) {
            return res.status(404).json({ message: "Offer not found." });
        }

        res.redirect("/admin/offer");
    } catch (error) {
        console.error("Error updating offer:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};


// DELETE: Delete Offer
exports.deleteOffer = async (req, res) => {
    try {
        const { offerId } = req.params;

        // Check if offer exists
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ message: "Offer not found." });
        }

        // Delete the offer
        await Offer.findByIdAndDelete(offerId);

        // Success response
        res.status(200).json({ message: "Offer successfully deleted." });
    } catch (error) {
        console.error("Error deleting offer:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
