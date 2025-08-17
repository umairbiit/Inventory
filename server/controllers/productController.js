import Product from "../models/Product.js";

// Create Product
export const createProduct = async (req, res) => {
  try {
    console.log("Creating product with data:", req.body);
    const { name, description, costPrice, salePrice, stock, category } = req.body;

    if (!name || costPrice == null || salePrice == null) {
      return res.status(400).json({ success: false, message: "Name, costPrice, and salePrice are required" });
    }

    const product = await Product.create({ name, description, costPrice, salePrice, stock, category });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  try {
    const { name, description, costPrice, salePrice, stock, category } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, costPrice, salePrice, stock, category },
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
