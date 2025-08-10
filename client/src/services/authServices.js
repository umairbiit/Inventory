import axios from "axios";
const API_URL = import.meta.env.VITE_BACKEND_URL;

export const signInUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, userData);
    return response;
  } catch (error) {
    return error.response;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, userData);
    return response;
  } catch (error) {
    return error.response;
  }
};

export const verifyEmailToken = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/auth/verify-email`, {
      params: { token },
    });
    return response;
  } catch (error) {
    return error.response;
  }
};

export const checkLoginStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/auth/loggedin-status`);
    return response;
  } catch (error) {
    return error.response;
  }
};

export const getUserDetails = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/auth/user-details`);
    return response;
  } catch (error) {
    return error.response;
  }
};

export const logout = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/auth/logout`);
    return response;
  } catch (error) {
    return error.response;
  }
};

export const sendResetEmail = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
      email,
    });
    return response;
  } catch (error) {
    return error.response;
  }
};

export const verifyResetToken = async (token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/verify-reset-token`,
      {
        token,
      }
    );
    return response;
  } catch (error) {
    return error.response;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
      token,
      newPassword,
    });
    return response;
  } catch (error) {
    return error.response;
  }
};
