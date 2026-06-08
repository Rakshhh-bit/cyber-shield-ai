import axios from "axios";
import { API_BASE_URL } from "./config";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  validateStatus: () => true, // Don't throw on any status code
});

api.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  // Ensure proper JSON serialization
  if (req.data) {
    req.headers["Content-Type"] = "application/json";
  }

  return req;
});

api.interceptors.response.use((res) => {
  if (res.status >= 400) {
    console.error("API Error:", {
      status: res.status,
      data: res.data,
      url: res.config?.url,
      method: res.config?.method,
      requestData: res.config?.data,
    });
  }
  return res;
});

export default api;
