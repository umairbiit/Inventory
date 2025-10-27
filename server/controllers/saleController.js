const Sale = require("../models/sale");
const Product = require("../models/product").default;

// ✅ Create Sale (multi-item + partial payment)
const createSale = async (req, res) => {
  try {
    const { items, customer, initialPayment, invoiceNumber, saleDate } = req.body;

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

    // Deduct stock
    for (const item of items) {
      const prod = await Product.findById(item.product);
      prod.stock -= item.quantity;
      await prod.save();
    }

    let sale = await Sale.create({
      customer,
      items: items.map((it) => ({
        product: it.product,
        quantity: it.quantity,
        salePrice: it.salePrice,
      })),
      invoiceNumber,
      initialPayment: initialPayment || 0,
      paymentReceived: initialPayment || 0,
      saleDate: saleDate || new Date(),
      user: req.user._id,
    });

    sale = await Sale.findById(sale._id)
      .populate("customer", "name email phone address")
      .populate({
        path: "items.product",
        select: "name description invoiceNumber costPrice retailPrice batchNumber expirationDate",
      })
      .lean();

    sale.items = sale.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        salePrice: item.salePrice,
      },
    }));

    res.status(201).json({ success: true, sale });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Get all Sales
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

// ✅ Update Payment (partial payments)
const updateSalePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (amount == null || isNaN(amount)) {
      return res
        .status(400)
        .json({ success: false, message: "Amount is required." });
    }

    let sale = await Sale.findOne({ _id: id, user: req.user._id });
    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    sale.paymentReceived += Number(amount);

    if (sale.paymentReceived >= sale.totalAmount) {
      sale.paymentStatus = "paid";
    } else if (sale.paymentReceived > 0) {
      sale.paymentStatus = "partial";
    } else {
      sale.paymentStatus = "unpaid";
    }

    await sale.save();

    sale = await Sale.findById(sale._id)
      .populate("customer", "name email phone address")
      .populate({
        path: "items.product",
        select:
          "name description invoiceNumber costPrice retailPrice salePrice batchNumber expirationDate",
      })
      .lean();

    sale.items = sale.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        salePrice: item.salePrice,
      },
    }));

    res.json({ success: true, sale });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Edit/Update Sale (with total + payment recalculation)
const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, customer, invoiceNumber, saleDate } = req.body;

    const sale = await Sale.findOne({ _id: id, user: req.user._id });
    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items are required." });
    }

    // --- 1️⃣ Restore old stock ---
    for (const oldItem of sale.items) {
      const product = await Product.findById(oldItem.product);
      if (product) {
        product.stock += oldItem.quantity;
        await product.save();
      }
    }

    // --- 2️⃣ Validate new items ---
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

    // --- 3️⃣ Deduct new stock ---
    for (const item of items) {
      const prod = await Product.findById(item.product);
      prod.stock -= item.quantity;
      await prod.save();
    }

    // --- 4️⃣ Update sale info ---
    sale.customer = customer || sale.customer;
    sale.invoiceNumber = invoiceNumber || sale.invoiceNumber;
    sale.saleDate = saleDate || sale.saleDate;
    sale.items = items.map((it) => ({
      product: it.product,
      quantity: it.quantity,
      salePrice: it.salePrice,
    }));

    // --- 5️⃣ Recalculate total amount ---
    sale.totalAmount = items.reduce(
      (sum, it) => sum + it.quantity * it.salePrice,
      0
    );

    // --- 6️⃣ Update payment status ---
    if (sale.paymentReceived >= sale.totalAmount) {
      sale.paymentStatus = "paid";
    } else if (sale.paymentReceived > 0) {
      sale.paymentStatus = "partial";
    } else {
      sale.paymentStatus = "unpaid";
    }

    await sale.save();

    // --- 7️⃣ Populate and return updated sale ---
    const updatedSale = await Sale.findById(sale._id)
      .populate("customer", "name email phone address")
      .populate({
        path: "items.product",
        select:
          "name description invoiceNumber costPrice retailPrice batchNumber expirationDate",
      })
      .lean();

    updatedSale.items = updatedSale.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        salePrice: item.salePrice,
      },
    }));

    res.status(200).json({ success: true, sale: updatedSale });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Delete Sale
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, user: req.user._id });
    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

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
  updateSale,
  deleteSale,
  updateSalePayment,
};
