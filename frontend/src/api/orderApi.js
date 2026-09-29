import api from "./client";

export const placeOrder = (payload) => api.post("/api/order/new", payload).then((r) => r.data);

export const fetchMyOrders = () => api.get("/api/order/my-orders").then((r) => r.data);

export const fetchAllOrders = () => api.get("/api/order/admin/all").then((r) => r.data);

export const fetchSingleOrder = (orderId) =>
  api.get(`/api/order/${orderId}`).then((r) => r.data);

export const updateOrderStatus = (orderId, status) =>
  api.put(`/api/order/admin/update/${orderId}`, { status }).then((r) => r.data);

export const confirmOrderPayment = (orderId) =>
  api.post(`/api/order/${orderId}/confirm`).then((r) => r.data);

export const abandonOrder = (orderId) =>
  api.delete(`/api/order/${orderId}`).then((r) => r.data);
