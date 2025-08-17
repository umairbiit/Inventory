const Sale = require("../models/sale");
const Expense = require("../models/expense");
const dayjs = require("dayjs");

// Get Profit/Loss for a period
const getProfitLoss = async (req, res) => {
  try {
    console.log("HERE")
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate)
      return res.status(400).json({ success: false, message: "startDate and endDate required" });

    const start = dayjs(startDate).startOf("day").toDate();
    const end = dayjs(endDate).endOf("day").toDate();

    // Fetch sales in the period
    const sales = await Sale.find({
      date: { $gte: start, $lte: end },
      user: req.user._id,
    }).populate("product", "costPrice");

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
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProfitLoss };
