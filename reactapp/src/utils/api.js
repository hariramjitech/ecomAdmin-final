import axios from "axios";

// Auto-switch between localhost and Examly proxy
const BASE_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:8080"
  : "https://ide-becabbbccbbfdfebebacdbf.premiumproject.examly.io/proxy/8080/api";

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ------------------- AUTH APIs ------------------- */

// User login (works for both users and admins)
export const loginUser = async (email, password) => {
  const response = await API.post("/auth/login", { email, password });
  // Save token & role for frontend usage
  localStorage.setItem("token", response.data.token);
  localStorage.setItem("role", response.data.role);
  return response.data; // { role, token }
};

// Register new USER
export const registerUser = async (name, email, password) => {
  const response = await API.post("/auth/register", { name, email, password });
  return response.data;
};

// Register new ADMIN
export const registerAdmin = async (name, email, password) => {
  const response = await API.post("/auth/register/admin", { name, email, password });
  return response.data;
};


// Product APIs
export const fetchProducts = () => axios.get(`${BASE_URL}/api/products`);
export const getProduct = (id) => axios.get(`${BASE_URL}/api/products/${id}`);
export const createProduct = (data) => axios.post(`${BASE_URL}/api/products`, data);
export const updateProduct = (id, data) => axios.put(`${BASE_URL}/api/products/${id}`, data);
export const deleteProduct = (id) => axios.delete(`${BASE_URL}/api/products/${id}`);

// Order APIs
export const fetchOrders = () => axios.get(`${BASE_URL}/api/orders`);
export const getOrder = (id) => axios.get(`${BASE_URL}/api/orders/${id}`);
export const createOrder = (data) => axios.post(`${BASE_URL}/api/orders`, data);
export const updateOrderStatus = (id, status) =>
  axios.patch(`${BASE_URL}/api/orders/${id}/status`, { status });
export const deleteOrder = (id) => axios.delete(`${BASE_URL}/api/orders/${id}`);
export const getOrderById = (id) => axios.get(`${BASE_URL}/api/orders/${id}`);


// user APIs
export const createUser = (userData) => API.post("/api/users", userData);
export const getAllUsers = () => API.get("/api/users");
export const getUserById = (id) => API.get(`/api/users/${id}`);
export const updateUser = (id, userData) => API.put(`/api/users/${id}`, userData);
export const deleteUser = (id) => API.delete(`/api/users/${id}`);