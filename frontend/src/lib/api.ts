import axios from "axios";

// ✅ Backend URL from .env
// VITE_API_URL="https://xxxx.execute-api.ap-south-1.amazonaws.com/dev"
const API_BASE_URL = import.meta.env.VITE_API_URL;

// ✅ Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Not needed for JWT Auth
  timeout: 30000,
});

// ✅ Add Token To Every Request If Exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Unified Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Backend unreachable
    if (!error.response) {
      console.error("❌ Backend unreachable:", API_BASE_URL);
      return Promise.reject(error);
    }

    // Token expired / invalid
    if (error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect admin users only
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/admin/login";
      }
    }

    return Promise.reject(error);
  }
);

// ✅ File Upload Helper (Cloudinary/Multer)
export const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

uploadApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Content-Type"] = "multipart/form-data";
  return config;
});

// ✅ Export Base URL (for images)
export const getBaseUrl = () => API_BASE_URL;

export default api;
