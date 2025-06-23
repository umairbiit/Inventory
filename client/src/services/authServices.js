import axios from "axios";
const API_URL = process.env.BACKEND_URL;

export const checkLoginStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/loggedin-status`);
    return response;
  } catch (error) {
    return error.response.data;
  }
};
