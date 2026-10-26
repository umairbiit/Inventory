const Sale = require("../models/sale");
const Expense = require("../models/expense");
const dayjs = require("dayjs");
const Product = require("../models/product").default;

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

    // Day bounds in the business time zone (Asia/Karachi by default), not
    // the server's own time zone.
    const off = parseOffset(req.query.tzOffset);
    const start = parseLocalDate(startDate, off, false);
    const end = parseLocalDate(endDate, off, true);
    if (!start || !end) {
      return res.status(400).json({ success: false, message: "Invalid date range" });
    }

    // 🔹 Build sale query
    // Sales are dated by saleDate ?? date (legacy) ?? createdAt
    const saleQuery = dateRangeMatch(req.user._id, start, end);
    if (customer) saleQuery.customer = customer;

    // 🔹 Fetch sales with product + customer info
    const sales = await Sale.find(saleQuery)
      .populate("items.product", "name costPrice salePrice")
      .populate("customer", "name")
      .sort({ saleDate: -1, createdAt: -1 });

    // 🔹 Fetch expenses
    const expenses = await Expense.find(expenseRangeMatch(req.user._id, start, end)).sort({ date: -1 });

    let totalSalesAmount = 0;
    let totalCost = 0;
    let pendingAmount = 0;
    let totalExpenses = 0;
    let totalRevenue = 0;

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
      totalRevenue += totalAmount;
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
      // additional (non-breaking) fields
      totalRevenue,
      salesCount: sales.length,
      sales: sales.map((s) => ({
        _id: s._id,
        invoiceNumber: s.invoiceNumber,
        customerName: s.customer?.name || "-",
        totalAmount: s.totalAmount,
        paymentReceived: s.paymentReceived,
        balance: s.balance,
        paymentStatus: s.paymentStatus,
        date: s.saleDate || s.date || s.createdAt,
        items: s.items.map((i) => ({
          productName: i.product?.name || "-",
          quantity: i.quantity,
          salePrice: i.salePrice,
          costPrice: i.product?.costPrice,
        })),
      })),
      expenses: expenses.map((e) => ({
        _id: e._id,
        description: e.description,
        amount: e.amount,
        date: e.date || e.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// Aggregation helpers for the dashboard & summary endpoints
// ---------------------------------------------------------------------------
const mongoose = require("mongoose");

// Business time zone offset in minutes. The shop runs on Asia/Karachi
// (UTC+5, no DST); the server itself may be in another zone (prod is CET).
const APP_TZ_OFFSET = Number.isFinite(Number(process.env.APP_TZ_OFFSET)) && process.env.APP_TZ_OFFSET !== ""
  ? Number(process.env.APP_TZ_OFFSET)
  : 300;
// Client may send its UTC offset in minutes (e.g. 300 for PKT). Defaults to the business TZ.
const parseOffset = (q) => {
  if (q === undefined || q === null || q === "") return APP_TZ_OFFSET;
  const n = Number(q);
  if (Number.isFinite(n) && Math.abs(n) <= 14 * 60) return Math.round(n);
  return APP_TZ_OFFSET;
};
const offsetString = (min) => {
  const sign = min < 0 ? "-" : "+";
  const a = Math.abs(min);
  return `${sign}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
};
// Start of the local day (for the given offset) that contains `date`, as a UTC Date
const localDayStart = (date, off) => {
  const shifted = new Date(date.getTime() + off * 60000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - off * 60000);
};
const localMonthStart = (date, off) => {
  const shifted = new Date(date.getTime() + off * 60000);
  shifted.setUTCDate(1);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - off * 60000);
};
// Parse "YYYY-MM-DD" (or any date string) into local-day bounds
const parseLocalDate = (str, off, endOfDay = false) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(str || ""));
  let start;
  if (m) {
    start = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) - off * 60000);
  } else {
    const d = new Date(str);
    if (isNaN(d)) return null;
    start = localDayStart(d, off);
  }
  return endOfDay ? new Date(start.getTime() + 86400000 - 1) : start;
};

const toObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(String(id)) : null;

// common stages: effective date + revenue + cost per sale
// effective sale date: saleDate ?? date (legacy) ?? createdAt
const saleDateExpr = { $ifNull: ["$saleDate", { $ifNull: ["$date", "$createdAt"] }] };
const saleBaseStages = (match) => [
  { $match: match },
  { $addFields: { _d: saleDateExpr } },
];
const dateRangeMatch = (userId, start, end, extra = {}) => ({
  user: userId,
  ...extra,
  $or: [
    { saleDate: { $gte: start, $lte: end } },
    { saleDate: null, date: { $gte: start, $lte: end } },
    { saleDate: null, date: null, createdAt: { $gte: start, $lte: end } },
  ],
});
// effective expense date: date ?? createdAt
const expenseDateExpr = { $ifNull: ["$date", "$createdAt"] };
const expenseRangeMatch = (userId, start, end) => ({
  user: userId,
  $or: [
    { date: { $gte: start, $lte: end } },
    { date: null, createdAt: { $gte: start, $lte: end } },
  ],
});
// payment status derived from the numbers (same rule as the Sale pre-save hook)
const statusExpr = {
  $cond: [
    { $lte: ["$_balance", 0] },
    "paid",
    { $cond: [{ $gt: ["$_received", 0] }, "partial", "unpaid"] },
  ],
};

// Per-sale totals: revenue, received, balance, cost (uses current product costPrice,
// same as the existing profit/loss report)
const perSaleStages = [
  {
    $lookup: {
      from: "products",
      localField: "items.product",
      foreignField: "_id",
      as: "_prods",
    },
  },
  {
    $addFields: {
      _revenue: {
        $sum: { $map: { input: "$items", as: "i", in: { $multiply: ["$$i.quantity", "$$i.salePrice"] } } },
      },
      _cost: {
        $sum: {
          $map: {
            input: "$items",
            as: "i",
            in: {
              $multiply: [
                "$$i.quantity",
                {
                  $ifNull: [
                    {
                      $let: {
                        vars: {
                          p: {
                            $arrayElemAt: [
                              { $filter: { input: "$_prods", as: "p", cond: { $eq: ["$$p._id", "$$i.product"] } } },
                              0,
                            ],
                          },
                        },
                        in: "$$p.costPrice",
                      },
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
    },
  },
  {
    $addFields: {
      _received: { $ifNull: ["$paymentReceived", 0] },
      _balance: { $max: [{ $subtract: ["$_revenue", { $ifNull: ["$paymentReceived", 0] }] }, 0] },
    },
  },
];

const totalsGroup = {
  _id: null,
  count: { $sum: 1 },
  revenue: { $sum: "$_revenue" },
  received: { $sum: "$_received" },
  outstanding: { $sum: "$_balance" },
  cost: { $sum: "$_cost" },
};
const emptyTotals = { count: 0, revenue: 0, received: 0, outstanding: 0, cost: 0 };
const cleanTotals = (t) => {
  const { _id, ...rest } = t || {};
  return { ...emptyTotals, ...rest };
};

const sumExpenses = async (userId, start, end) => {
  const r = await Expense.aggregate([
    { $match: expenseRangeMatch(userId, start, end) },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  return { total: r[0]?.total || 0, count: r[0]?.count || 0 };
};

const withProfit = (t, expenses) => ({
  salesCount: t.count,
  revenue: t.revenue,
  received: t.received,
  outstanding: t.outstanding,
  cost: t.cost,
  grossProfit: t.revenue - t.cost,
  expenses,
  // accrual profit: sales value - cost of goods - expenses
  profit: t.revenue - t.cost - expenses,
  // cash profit (same formula as the legacy profit/loss report)
  cashProfit: t.received - t.cost - expenses,
  avgSale: t.count ? t.revenue / t.count : 0,
});

const topProductsStages = (limit) => [
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.product",
      quantity: { $sum: "$items.quantity" },
      revenue: { $sum: { $multiply: ["$items.quantity", "$items.salePrice"] } },
      sales: { $sum: 1 },
    },
  },
  // deterministic order for ties
  { $sort: { revenue: -1, quantity: -1, _id: 1 } },
  { $limit: limit },
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "_id",
      as: "p",
    },
  },
  { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      productId: "$_id",
      name: { $ifNull: ["$p.name", "(deleted product)"] },
      category: { $ifNull: ["$p.category", "-"] },
      stock: "$p.stock",
      quantity: 1,
      revenue: 1,
      sales: 1,
      profit: { $subtract: ["$revenue", { $multiply: ["$quantity", { $ifNull: ["$p.costPrice", 0] }] }] },
    },
  },
];

const topCustomersStages = (limit) => [
  {
    $group: {
      _id: "$customer",
      revenue: { $sum: "$_revenue" },
      received: { $sum: "$_received" },
      outstanding: { $sum: "$_balance" },
      sales: { $sum: 1 },
      lastSale: { $max: "$_d" },
    },
  },
  { $sort: { revenue: -1, _id: 1 } },
  { $limit: limit },
  {
    $lookup: {
      from: "customers",
      localField: "_id",
      foreignField: "_id",
      as: "c",
    },
  },
  { $unwind: { path: "$c", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      customerId: "$_id",
      name: { $ifNull: ["$c.name", "(deleted customer)"] },
      phone: "$c.phone",
      revenue: 1,
      received: 1,
      outstanding: 1,
      sales: 1,
      lastSale: 1,
    },
  },
];

const dailySeries = async (userId, start, end, tz, extraMatch = {}) => {
  const [salesByDay, expByDay] = await Promise.all([
    Sale.aggregate([
      ...saleBaseStages(dateRangeMatch(userId, start, end, extraMatch)),
      ...perSaleStages,
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$_d", timezone: tz } },
          revenue: { $sum: "$_revenue" },
          received: { $sum: "$_received" },
          cost: { $sum: "$_cost" },
          count: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: expenseRangeMatch(userId, start, end) },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: expenseDateExpr, timezone: tz } },
          expenses: { $sum: "$amount" },
        },
      },
    ]),
  ]);
  const map = new Map();
  salesByDay.forEach((d) => map.set(d._id, { revenue: d.revenue, received: d.received, cost: d.cost, count: d.count, expenses: 0 }));
  expByDay.forEach((d) => {
    const cur = map.get(d._id) || { revenue: 0, received: 0, cost: 0, count: 0, expenses: 0 };
    cur.expenses = d.expenses;
    map.set(d._id, cur);
  });
  // fill every day in range (cap at ~400 days to keep payload small)
  const out = [];
  const offMs = start.getTime();
  const days = Math.min(Math.ceil((end.getTime() - offMs + 1) / 86400000), 400);
  const off = (tz[0] === "-" ? -1 : 1) * (Number(tz.slice(1, 3)) * 60 + Number(tz.slice(4, 6)));
  for (let i = 0; i < days; i++) {
    const d = new Date(offMs + i * 86400000 + off * 60000);
    const key = d.toISOString().slice(0, 10);
    const v = map.get(key) || { revenue: 0, received: 0, cost: 0, count: 0, expenses: 0 };
    out.push({ date: key, ...v, profit: v.revenue - v.cost - v.expenses });
  }
  return out;
};

// GET /api/reports/dashboard?tzOffset=300&lowStock=10
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const off = parseOffset(req.query.tzOffset);
    const tz = offsetString(off);
    const lowStockLimit = Math.max(0, Number(req.query.lowStock) || 10);
    const now = new Date();
    const todayStart = localDayStart(now, off);
    const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);
    const monthStart = localMonthStart(now, off);
    const trendStart = new Date(todayStart.getTime() - 29 * 86400000);

    const periodTotals = (start, end) =>
      Sale.aggregate([
        ...saleBaseStages(dateRangeMatch(userId, start, end)),
        ...perSaleStages,
        { $group: totalsGroup },
      ]).then((r) => cleanTotals(r[0]));

    const [today, month, todayExp, monthExp, outstandingAll, trend, topProducts, topCustomers, recent, lowStock, expiring] =
      await Promise.all([
        periodTotals(todayStart, todayEnd),
        periodTotals(monthStart, todayEnd),
        sumExpenses(userId, todayStart, todayEnd),
        sumExpenses(userId, monthStart, todayEnd),
        Sale.aggregate([
          // every sale with a balance due (legacy docs may lack paymentStatus)
          { $match: { user: userId } },
          ...perSaleStages,
          { $match: { _balance: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              amount: { $sum: "$_balance" },
              count: { $sum: 1 },
              partial: { $sum: { $cond: [{ $gt: ["$_received", 0] }, 1, 0] } },
              unpaid: { $sum: { $cond: [{ $gt: ["$_received", 0] }, 0, 1] } },
            },
          },
        ]),
        dailySeries(userId, trendStart, todayEnd, tz),
        Sale.aggregate([
          ...saleBaseStages(dateRangeMatch(userId, trendStart, todayEnd)),
          ...topProductsStages(5),
        ]),
        Sale.aggregate([
          ...saleBaseStages(dateRangeMatch(userId, trendStart, todayEnd)),
          ...perSaleStages,
          ...topCustomersStages(5),
        ]),
        Sale.aggregate([
          { $match: { user: userId } },
          { $addFields: { _d: saleDateExpr } },
          { $sort: { _d: -1, createdAt: -1, _id: -1 } },
          { $limit: 8 },
          ...perSaleStages,
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "c",
            },
          },
          {
            $project: {
              invoiceNumber: 1,
              date: "$_d",
              customerName: { $ifNull: [{ $arrayElemAt: ["$c.name", 0] }, "-"] },
              totalAmount: "$_revenue",
              paymentReceived: "$_received",
              balance: "$_balance",
              paymentStatus: statusExpr,
              itemsCount: { $size: { $ifNull: ["$items", []] } },
            },
          },
        ]),
        Product.find({ stock: { $lte: lowStockLimit } })
          .select("name stock category batchNumber salePrice")
          .sort({ stock: 1, name: 1 })
          .limit(10)
          .lean(),
        Product.find({
          expirationDate: { $ne: null, $lte: new Date(now.getTime() + 60 * 86400000) },
        })
          .select("name stock expirationDate batchNumber")
          .sort({ expirationDate: 1 })
          .limit(10)
          .lean(),
      ]);

    const lowStockCount = await Product.countDocuments({ stock: { $lte: lowStockLimit } });

    res.status(200).json({
      success: true,
      generatedAt: now,
      tzOffset: off,
      today: withProfit(today, todayExp.total),
      month: withProfit(month, monthExp.total),
      outstanding: {
        amount: outstandingAll[0]?.amount || 0,
        count: outstandingAll[0]?.count || 0,
        partial: outstandingAll[0]?.partial || 0,
        unpaid: outstandingAll[0]?.unpaid || 0,
      },
      trend,
      topProducts,
      topCustomers,
      recentSales: recent,
      lowStock: { threshold: lowStockLimit, count: lowStockCount, items: lowStock },
      expiringSoon: expiring,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&customer=&tzOffset=300
const getSummary = async (req, res) => {
  try {
    const { startDate, endDate, customer } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "startDate and endDate are required" });
    }
    const off = parseOffset(req.query.tzOffset);
    const tz = offsetString(off);
    const start = parseLocalDate(startDate, off, false);
    const end = parseLocalDate(endDate, off, true);
    if (!start || !end || start > end) {
      return res.status(400).json({ success: false, message: "Invalid date range" });
    }
    const userId = req.user._id;
    const extra = {};
    if (customer) {
      const cid = toObjectId(customer);
      if (!cid) return res.status(400).json({ success: false, message: "Invalid customer" });
      extra.customer = cid;
    }
    const match = dateRangeMatch(userId, start, end, extra);

    // previous period of equal length (for comparison)
    const len = end.getTime() - start.getTime() + 1;
    const prevStart = new Date(start.getTime() - len);
    const prevEnd = new Date(start.getTime() - 1);

    const [totalsR, prevR, exp, prevExp, series, topProducts, topCustomers, categories, statuses, expenseTop] =
      await Promise.all([
        Sale.aggregate([...saleBaseStages(match), ...perSaleStages, { $group: totalsGroup }]),
        Sale.aggregate([
          ...saleBaseStages(dateRangeMatch(userId, prevStart, prevEnd, extra)),
          ...perSaleStages,
          { $group: totalsGroup },
        ]),
        sumExpenses(userId, start, end),
        sumExpenses(userId, prevStart, prevEnd),
        dailySeries(userId, start, end, tz, extra),
        Sale.aggregate([...saleBaseStages(match), ...topProductsStages(10)]),
        Sale.aggregate([...saleBaseStages(match), ...perSaleStages, ...topCustomersStages(10)]),
        Sale.aggregate([
          ...saleBaseStages(match),
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              localField: "items.product",
              foreignField: "_id",
              as: "p",
            },
          },
          { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: { $ifNull: ["$p.category", "Uncategorised"] },
              revenue: { $sum: { $multiply: ["$items.quantity", "$items.salePrice"] } },
              cost: { $sum: { $multiply: ["$items.quantity", { $ifNull: ["$p.costPrice", 0] }] } },
              quantity: { $sum: "$items.quantity" },
            },
          },
          { $sort: { revenue: -1 } },
          { $project: { _id: 0, category: "$_id", revenue: 1, cost: 1, quantity: 1, profit: { $subtract: ["$revenue", "$cost"] } } },
        ]),
        Sale.aggregate([
          ...saleBaseStages(match),
          ...perSaleStages,
          { $group: { _id: statusExpr, count: { $sum: 1 }, amount: { $sum: "$_revenue" }, balance: { $sum: "$_balance" } } },
          { $project: { _id: 0, status: "$_id", count: 1, amount: 1, balance: 1 } },
        ]),
        Expense.aggregate([
          { $match: expenseRangeMatch(userId, start, end) },
          { $group: { _id: { $toLower: { $trim: { input: "$description" } } }, label: { $first: "$description" }, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
          { $sort: { amount: -1 } },
          { $limit: 10 },
          { $project: { _id: 0, description: "$label", amount: 1, count: 1 } },
        ]),
      ]);

    res.status(200).json({
      success: true,
      range: { start, end, tzOffset: off },
      totals: withProfit(cleanTotals(totalsR[0]), exp.total),
      expensesCount: exp.count,
      previous: withProfit(cleanTotals(prevR[0]), prevExp.total),
      series,
      topProducts,
      topCustomers,
      categories,
      paymentStatus: statuses,
      topExpenses: expenseTop,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProfitLoss, getDashboard, getSummary };
