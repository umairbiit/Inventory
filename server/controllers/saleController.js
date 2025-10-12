const Sale = require("../models/sale");
const Product = require("../models/product").default;

// ✅ Create Sale (multi-item + partial payment)
const createSale = async (req, res) => {
  try {
    const { items, customer, initialPayment } = req.body;

    // --- Basic validations ---
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required (at least one item).",
      });
    }
    if (!customer) {
      return res
        .status(400)
        .json({ success: false, message: "Customer is required." });
    }

    // --- Validate stock for each product ---
    for (const item of items) {
      const prod = await Product.findById(item.product);
      if (!prod) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product ${prod.name}`,
        });
      }
    }

    // --- Deduct stock ---
    for (const item of items) {
      const prod = await Product.findById(item.product);
      prod.stock -= item.quantity;
      await prod.save();
    }

    // --- Create sale document ---
    let sale = await Sale.create({
      customer,
      items: items.map((it) => ({
        product: it.product,
        quantity: it.quantity,
        salePrice: it.salePrice,
      })),
      invoiceNumber: req.body.invoiceNumber, // ✅ accept from frontend
      initialPayment: initialPayment || 0,
      paymentReceived: initialPayment || 0,
      user: req.user._id,
    });

    // ✅ Re-fetch populated sale to return full customer/product info
    sale = await Sale.findById(sale._id)
      .populate("customer", "name email phone address")
      .populate("items.product", "name invoiceNumber costPrice salePrice retailPrice batchNumber expirationDate");

    res.status(201).json({ success: true, sale });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Get all Sales (multi-item)
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find({ user: req.user._id })
      .populate("customer", "name email phone")
      .populate("items.product", "name costPrice salePrice")
      .sort({ date: -1 });

    res.status(200).json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Payment Received (partial payments)
const updateSalePayment = async (req, res) => {
  try {
    const { id } = req.params; // sale id
    const { amount } = req.body; // how much was newly received (additional)

    if (amount == null || isNaN(amount)) {
      return res.status(400).json({ success: false, message: "Amount is required." });
    }

    let sale = await Sale.findOne({ _id: id, user: req.user._id });
    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    // ✅ ADD to existing payment instead of overwrite
    sale.paymentReceived += Number(amount);

    // Recalculate payment status
    if (sale.paymentReceived >= sale.totalAmount) {
      sale.paymentStatus = "paid";
    } else if (sale.paymentReceived > 0) {
      sale.paymentStatus = "partial";
    } else {
      sale.paymentStatus = "unpaid";
    }

    await sale.save();

    // ✅ Re-fetch populated sale to return full customer/product info
    sale = await Sale.findById(sale._id)
      .populate("customer", "name email phone address")
      .populate("items.product", "name invoiceNumber costPrice salePrice retailPrice batchNumber expirationDate");

    res.json({ success: true, sale });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Sale (restore stock for each item)
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, user: req.user._id });
    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    // Restore stock for each item
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    await sale.deleteOne();

    res.status(200).json({
      success: true,
      message: "Sale deleted and stock restored",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSale,
  getSales,
  deleteSale,
  updateSalePayment,
};
