// const userAuthenticated = require("../middleware/adminauthmildware");
const Product = require("../../models/productSchema");


exports.getProducts = [
//   userAuthenticated,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const products = await Product.find().skip(skip).limit(limit);
      const totalProducts = await Product.countDocuments();
      const totalPages = Math.ceil(totalProducts / limit);

      res.render("admin/adminProduct", {
        message: req.query.message || undefined, // Fetch message from query parameters
        products,
        currentPage: page,
        totalPages,
      });
    } catch (err) {
      res.status(500).send("Error fetching products");
    }
  },
];


const Category = require("../../models/categoryModel"); 

exports.getAddProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("admin/adminAddProduct", {
      pageTitle: "Add Product",
      path: "/admin/products/add",
      categories: categories,
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Error fetching categories");
  }
};




exports.postAddProduct = (req, res) => {
  const { productName, brand, gender, categoriesId } = req.body;

  // Create a new product instance
  const newProduct = new Product({
    productName,
    brand,
    gender,
    categoriesId,
  });

  // Save the product to the database
  newProduct
    .save()
    .then(() => {
      // Redirect to a success page or send a success response
      res.redirect("/admin/products"); // Or another appropriate route
    })
    .catch((err) => {
      console.error("Error adding product:", err);
      res.status(500).send("Error adding product");
    });
};





// Update Product
exports.updateProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, {
      productName: req.body.productName,
      brand: req.body.brand,
      gender: req.body.gender,
      categoriesId: req.body.categoriesId,
    });
    res.redirect('/admin/products?message=Product%20updated%20successfully');
  } catch (err) {
    res.status(500).send('Error updating product');
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/products?message=Product%20deleted%20successfully');
  } catch (err) {
    res.status(500).send('Error deleting product');
  }
};


// Add Variant
exports.addVariant = async (req, res) => {
  try {
    const newVariant = new Variant({
      productId: req.body.productId,
      color: req.body.color,
      price: req.body.price,
      discountPrice: req.body.discountPrice,
      discountPercentage: req.body.discountPercentage,
      rating: req.body.rating,
      imageUrl: req.body.imageUrl.split(','),
    });
    await newVariant.save();
    res.redirect('/admin/products?message=Variant%20added%20successfully');
  } catch (err) {
    res.status(500).send('Error adding variant');
  }
};

// Update Variant
exports.updateVariant = async (req, res) => {
  try {
    await Variant.findByIdAndUpdate(req.params.id, {
      color: req.body.color,
      price: req.body.price,
      discountPrice: req.body.discountPrice,
      discountPercentage: req.body.discountPercentage,
      rating: req.body.rating,
      imageUrl: req.body.imageUrl.split(','),
    });
    res.redirect('/admin/products?message=Variant%20updated%20successfully');
  } catch (err) {
    res.status(500).send('Error updating variant');
  }
};

// Delete Variant
exports.deleteVariant = async (req, res) => {
  try {
    await Variant.findByIdAndDelete(req.params.id);
    res.redirect('/admin/products?message=Variant%20deleted%20successfully');
  } catch (err) {
    res.status(500).send('Error deleting variant');
  }
};
