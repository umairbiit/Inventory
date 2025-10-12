const Sale = require("../models/sale");
const Expense = require("../models/expense");
const dayjs = require("dayjs");

// Get Profit/Loss for a period (with optional customer filter)
const getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate, customer, includeUnpaid } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const start = dayjs(startDate).startOf("day").toDate();
    const end = dayjs(endDate).endOf("day").toDate();

    // 🔹 Build sale query
    const saleQuery = {
      date: { $gte: start, $lte: end },
      user: req.user._id,
    };
    if (customer) saleQuery.customer = customer;

    // 🔹 Fetch sales with product + customer info
    const sales = await Sale.find(saleQuery)
      .populate("items.product", "name costPrice salePrice")
      .populate("customer", "name");

    // 🔹 Fetch expenses
    const expenses = await Expense.find({
      date: { $gte: start, $lte: end },
      user: req.user._id,
    });

    let totalSalesAmount = 0;
    let totalCost = 0;
    let pendingAmount = 0;
    let totalExpenses = 0;

    // 🔹 Loop through each sale
    sales.forEach((sale) => {
      const totalAmount = sale.totalAmount || 0;
      const received = sale.paymentReceived || 0;
      const balance = sale.balance || 0;

      // Sum cost for all items
      const saleCost = (sale.items || []).reduce((sum, it) => {
        const cost = (it.product?.costPrice || 0) * it.quantity;
        return sum + cost;
      }, 0);

      totalSalesAmount += received;
      totalCost += saleCost;
      pendingAmount += balance;
    });

    totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // 🔹 Profit only on received payments
    const profit = totalSalesAmount - totalCost - totalExpenses;

    // 🔹 Optional: Expected profit (including pending balances)
    const expectedProfit =
      includeUnpaid === "true"
        ? totalSalesAmount + pendingAmount - totalCost - totalExpenses
        : profit;

    res.status(200).json({
      success: true,
      totalSalesAmount,
      totalCost,
      totalExpenses,
      pendingAmount,
      profit,
      expectedProfit,
      sales: sales.map((s) => ({
        customerName: s.customer?.name || "-",
        totalAmount: s.totalAmount,
        paymentReceived: s.paymentReceived,
        balance: s.balance,
        paymentStatus: s.paymentStatus,
        date: s.date,
        items: s.items.map((i) => ({
          productName: i.product?.name || "-",
          quantity: i.quantity,
          salePrice: i.salePrice,
          costPrice: i.product?.costPrice,
        })),
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
