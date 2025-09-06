const Customer = require("../models/customer");

// Create Customer
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      address,
      user: req.user._id,
    });

    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all Customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Customer
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, email, phone, address },
      { new: true, runValidators: true }
    );

    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, message: "Customer deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
