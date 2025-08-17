const Sale = require("../models/sale");
const Product = require("../models/product").default;

// Create Sale
const createSale = async (req, res) => {
  try {
    const { product, quantity, discount } = req.body;

    if (!product || !quantity) {
      return res.status(400).json({ success: false, message: "Product and quantity are required" });
    }

    const prod = await Product.findById(product);
    if (!prod) return res.status(404).json({ success: false, message: "Product not found" });

    if (prod.stock < quantity) {
      return res.status(400).json({ success: false, message: "Not enough stock available" });
    }

    // Final sale price after discount
    const salePrice = prod.salePrice - (discount || 0);

    // Create sale
    const sale = await Sale.create({
      product,
      quantity,
      salePrice,
      discount: discount || 0,
      date: Date.now(),
      user: req.user._id,
    });

    // Reduce product stock
    prod.stock -= quantity;
    await prod.save();

    res.status(201).json({ success: true, sale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all Sales
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find({ user: req.user._id })
      .populate("product", "name costPrice salePrice")
      .sort({ date: -1 });
    res.status(200).json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Sale (and restore product stock)
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, user: req.user._id });
    if (!sale) return res.status(404).json({ success: false, message: "Sale not found" });

    const product = await Product.findById(sale.product);
    if (product) {
      product.stock += sale.quantity; // restore stock
      await product.save();
    }

    await sale.deleteOne();

    res.status(200).json({ success: true, message: "Sale deleted and stock restored" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSale,
  getSales,
  deleteSale,
};
