import axios from "axios";
import { API_BASE_URL } from "./config";

console.log("API Base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout
});

api.interceptors.request.use((req) => {
  console.log("Request:", {
    method: req.method,
    url: req.url,
    baseURL: req.baseURL,
    data: req.data,
    headers: req.headers,
  });

  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

api.interceptors.response.use(
  (res) => {
    console.log("Response:", {
      status: res.status,
      url: res.config?.url,
      data: res.data,
    });
    return res;
  },
  (err) => {
    console.error("Request failed:", {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      data: err.response?.data,
      url: err.config?.url,
    });
    return Promise.reject(err);
  }
);

export default api;
