import api from "./client";

export const fetchAddress = () => api.get("/api/address").then((r) => r.data);

export const createAddress = (data) => api.post("/api/address", data).then((r) => r.data);

export const updateAddress = (id, data) =>
  api.patch(`/api/address/${id}`, data).then((r) => r.data);

export const deleteAddress = (id) => api.delete(`/api/address/${id}`).then((r) => r.data);
