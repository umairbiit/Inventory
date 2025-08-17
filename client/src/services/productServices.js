import axios from "axios";
const API_URL = import.meta.env.VITE_BACKEND_URL;

// Get all products
export const getProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/products`, { withCredentials: true });
    return response;
  } catch (error) {
    return error.response;
  }
};

// Get single product by ID
export const getProductById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/products/${id}`, { withCredentials: true });
    return response;
  } catch (error) {
    return error.response;
  }
};

// Create new product
export const createProduct = async (productData) => {
  try {
    const response = await axios.post(`${API_URL}/api/products`, productData, { withCredentials: true });
    return response;
  } catch (error) {
    return error.response;
  }
};

// Update product by ID
export const updateProduct = async (id, productData) => {
  try {
    const response = await axios.put(`${API_URL}/api/products/${id}`, productData, { withCredentials: true });
    return response;
  } catch (error) {
    return error.response;
  }
};

// Delete product by ID
export const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/products/${id}`, { withCredentials: true });
    return response;
  } catch (error) {
    return error.response;
  }
};
