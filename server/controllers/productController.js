import Product from "../models/product.js";

// Create Product
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      costPrice,
      salePrice,
      retailPrice,
      stock,
      category,
      datePurchased,
      expirationDate,
      batchNumber,
    } = req.body;

    // Manual required field check
    if (!name || costPrice == null || salePrice == null || retailPrice == null) {
      return res.status(400).json({
        success: false,
        message: "Name, costPrice, salePrice and retailPrice are required",
      });
    }

    const product = new Product({
      name,
      description,
      costPrice,
      salePrice,
      retailPrice,
      stock,
      category,
      expirationDate,
      datePurchased,
      batchNumber,
    });

    const savedProduct = await product.save(); // ensures validation + DB write

    // Extra safety check (should always pass if save succeeded)
    if (!savedProduct || !savedProduct._id) {
      return res.status(500).json({
        success: false,
        message: "Product was not saved. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      product: savedProduct,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};


// Get All Products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      costPrice,
      salePrice,
      retailPrice,
      stock,
      category,
      expirationDate,
      datePurchased,
      batchNumber
    } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, costPrice, salePrice, retailPrice, stock, category, expirationDate, datePurchased, batchNumber },
      { new: true, runValidators: true }
    );

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};


// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
