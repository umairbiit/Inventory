import axios from "axios";
import { tzOffset } from "../utils/format";

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const getDashboard = async (params = {}) => {
  const { data } = await axios.get(`${API_URL}/api/reports/dashboard`, {
    params: { tzOffset: tzOffset(), ...params },
    withCredentials: true,
  });
  return data;
};

export const getReportSummary = async ({ startDate, endDate, customer }) => {
  const { data } = await axios.get(`${API_URL}/api/reports/summary`, {
    params: { startDate, endDate, customer: customer || undefined, tzOffset: tzOffset() },
    withCredentials: true,
  });
  return data;
};

export const getProfitLoss = async ({ startDate, endDate, customer }) => {
  const { data } = await axios.get(`${API_URL}/api/reports/profit-loss`, {
    params: { startDate, endDate, customer: customer || undefined },
    withCredentials: true,
  });
  return data;
};
