import axios from "axios";

const api = axios.create({
  baseURL: "https://YOUR-RENDER-BACKEND.onrender.com/api",
});

// ✅ AUTO TOKEN ATTACH
api.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default api;