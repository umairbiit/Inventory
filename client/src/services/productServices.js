import axios from "axios";
const API_URL = import.meta.env.VITE_BACKEND_URL;

// Get all products
export const getProducts = async () => {
  const response = await axios.get(`${API_URL}/api/products`, { withCredentials: true });
  return response;
};

// Get single product by ID
export const getProductById = async (id) => {
  const response = await axios.get(`${API_URL}/api/products/${id}`, { withCredentials: true });
  return response;
};

// Create new product
export const createProduct = async (productData) => {
  const response = await axios.post(`${API_URL}/api/products`, productData, { withCredentials: true });
  return response;
};

// Update product by ID
export const updateProduct = async (id, productData) => {
  const response = await axios.put(`${API_URL}/api/products/${id}`, productData, { withCredentials: true });
  return response;
};

// Delete product by ID
export const deleteProduct = async (id) => {
  const response = await axios.delete(`${API_URL}/api/products/${id}`, { withCredentials: true });
  return response;
};
