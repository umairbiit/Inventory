import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

// Create a new sale
export const createSale = async (saleData) => {
  try {
    const response = await axios.post(`${API_URL}/api/sales`, saleData, {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    return error.response;
  }
};

// Get all sales
export const getSales = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/sales`, {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    return error.response;
  }
};

export const updateSaleService = async (saleId, saleData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/sales/${saleId}`,
      saleData,
      { withCredentials: true }
    );
    return response;
  } catch (error) {
    return error.response;
  }
};

// Delete a sale
export const deleteSale = async (saleId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/sales/${saleId}`, {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    return error.response;
  }
};

// ✅ NEW — Update payment for a sale
export const updateSalePayment = async (saleId, amount) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/sales/${saleId}/payment`,
      { amount },
      { withCredentials: true }
    );
    return response;
  } catch (error) {
    return error.response;
  }
};
