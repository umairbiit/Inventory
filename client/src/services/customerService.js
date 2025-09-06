import axios from "axios";
const API_URL = import.meta.env.VITE_BACKEND_URL + "/api/customers";

// Create customer
export const createCustomer = async (data) => {
  try {
    const res = await axios.post(API_URL, data, { withCredentials: true });
    return res.data;
  } catch (err) {
    return err.response.data;
  }
};

// Get all customers
export const getCustomers = async () => {
  try {
    const res = await axios.get(API_URL, { withCredentials: true });
    return res.data;
  } catch (err) {
    return err.response.data;
  }
};

// Update customer
export const updateCustomer = async (id, data) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data, { withCredentials: true });
    return res.data;
  } catch (err) {
    return err.response.data;
  }
};

// Delete customer
export const deleteCustomer = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    return res.data;
  } catch (err) {
    return err.response.data;
  }
};
