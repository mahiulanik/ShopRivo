import api from "./client";

export const fetchProducts = (params = {}) =>
  api.get("/api/product", { params }).then((r) => r.data);

export const fetchSingleProduct = (productId) =>
  api.get(`/api/product/${productId}`).then((r) => r.data);

export const fetchCategories = () => api.get("/api/category").then((r) => r.data);

export const aiSearch = (userPrompt) =>
  api.post("/api/product/ai-search", { userPrompt }).then((r) => r.data);

export const createProduct = (formData) =>
  api
    .post("/api/product/admin/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const updateProduct = (productId, formData) =>
  api
    .patch(`/api/product/admin/update/${productId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const deleteProduct = (productId) =>
  api.delete(`/api/product/admin/delete/${productId}`).then((r) => r.data);

export const postReview = (productId, data) =>
  api.put(`/api/product/post-new/review/${productId}`, data).then((r) => r.data);

export const deleteReview = (productId) =>
  api.delete(`/api/product/delete/review/${productId}`).then((r) => r.data);
