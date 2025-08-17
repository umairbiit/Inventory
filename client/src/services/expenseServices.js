import axios from "axios";
const API_URL = import.meta.env.VITE_BACKEND_URL;

// Get all expenses
export const getExpenses = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/expenses`, { withCredentials: true });
    return response;
  } catch (error) {
    return error.response;
  }
};

// Get single expense by ID
export const getExpenseById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/expenses/${id}`, { withCredentials: true });
    return response;
  } catch (error) {
    return error.response;
  }
};

// Create new expense
export const createExpense = async (expenseData) => {
  try {
    const response = await axios.post(`${API_URL}/api/expenses`, expenseData, { withCredentials: true });
    return response;
  } catch (error) {
    return error.response;
  }
};

// Update expense by ID
export const updateExpense = async (id, expenseData) => {
  try {
    const response = await axios.put(`${API_URL}/api/expenses/${id}`, expenseData, { withCredentials: true });
    return response;
  } catch (error) {
    return error.response;
  }
};

// Delete expense by ID
export const deleteExpense = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/expenses/${id}`, { withCredentials: true });
    return response;
  } catch (error) {
    return error.response;
  }
};
