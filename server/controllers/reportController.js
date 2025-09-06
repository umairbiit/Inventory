const Sale = require("../models/sale");
const Expense = require("../models/expense");
const dayjs = require("dayjs");

// Get Profit/Loss for a period (with optional customer filter)
const getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate, customer } = req.query;

    if (!startDate || !endDate)
      return res.status(400).json({
        success: false,
        message: "startDate and endDate required",
      });

    const start = dayjs(startDate).startOf("day").toDate();
    const end = dayjs(endDate).endOf("day").toDate();

    // Build query for sales
    const saleQuery = {
      date: { $gte: start, $lte: end },
      user: req.user._id,
    };

    if (customer) {
      saleQuery.customer = customer; // filter by customer if provided
    }

    // Fetch sales in the period (populate product and customer name)
    const sales = await Sale.find(saleQuery)
      .populate("product", "costPrice name")
      .populate("customer", "name");

    // Fetch expenses in the period
    const expenses = await Expense.find({
      date: { $gte: start, $lte: end },
      user: req.user._id,
    });

    // Calculate total sales amount and cost
    let totalSalesAmount = 0;
    let totalCost = 0;

    sales.forEach((sale) => {
      totalSalesAmount += (sale.salePrice || 0) * sale.quantity;
      totalCost += (sale.product.costPrice || 0) * sale.quantity;
    });

    // Total expenses
    let totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Profit or Loss
    const profit = totalSalesAmount - totalCost - totalExpenses;

    res.status(200).json({
      success: true,
      totalSalesAmount,
      totalCost,
      totalExpenses,
      profit,
      sales: sales.map((s) => ({
        productName: s.product.name,
        customerName: s.customer?.name || "-", // include customer name
        quantity: s.quantity,
        salePrice: s.salePrice,
        discount: s.discount,
        totalAmount: (s.salePrice || 0) * s.quantity,
        date: s.date,
      })),
      expenses: expenses.map((e) => ({
        description: e.description,
        amount: e.amount,
        date: e.date,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProfitLoss };
