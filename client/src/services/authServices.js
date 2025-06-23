import axios from "axios";
const API_URL = import.meta.env.VITE_BACKEND_URL;

export const checkLoginStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/auth/loggedin-status`);
    return response;
  } catch (error) {
    return error.response.data;
  }
};

export const getUserDetails = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/auth/user-details`);
    return response;
  } catch (error) {
    return error.response.data;
  }
};

export const logout = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/auth/logout`);
    return response;
  } catch (error) {
    return error.response.data;
  }
};
