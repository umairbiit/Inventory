const Expense = require("../models/expense");

// Create Expense
const createExpense = async (req, res) => {
  try {
    const { description, amount, date } = req.body;

    if (!description || amount == null) {
      return res.status(400).json({ success: false, message: "Description and amount are required" });
    }

    const expense = await Expense.create({
      description,
      amount,
      date: date || Date.now(),
      user: req.user._id, // from JWT middleware
    });

    res.status(201).json({ success: true, expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all Expenses
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
    res.status(200).json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single Expense
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
    res.status(200).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Expense
const updateExpense = async (req, res) => {
  try {
    const { description, amount, date } = req.body;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { description, amount, date },
      { new: true, runValidators: true }
    );

    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

    res.status(200).json({ success: true, expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Expense
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

    res.status(200).json({ success: true, message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
