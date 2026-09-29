import api from "./client";

export const fetchAllUsers = (page = 1, role) =>
  api
    .get("/api/admin/get-all-users", { params: role ? { page, role } : { page } })
    .then((r) => r.data);

export const deleteUser = (id) => api.delete(`/api/admin/delete/${id}`).then((r) => r.data);

export const updateUserRole = (id, role) =>
  api.patch(`/api/admin/role/${id}`, { role }).then((r) => r.data);

export const fetchDashboardStats = () =>
  api.get("/api/admin/fetch/dashboard-stats").then((r) => r.data);

export const fetchCategories = () => api.get("/api/admin/category").then((r) => r.data);

export const createCategory = (name) =>
  api.post("/api/admin/category", { name }).then((r) => r.data);

export const updateCategory = (id, name) =>
  api.patch(`/api/admin/category/${id}`, { name }).then((r) => r.data);

export const deleteCategory = (id) =>
  api.delete(`/api/admin/category/${id}`).then((r) => r.data);

export const fetchMedia = () => api.get("/api/admin/media").then((r) => r.data);

export const deleteMedia = (id) =>
  api.delete(`/api/admin/media/${id}`).then((r) => r.data);

export const fetchReviews = (page = 1) =>
  api.get("/api/admin/reviews", { params: { page } }).then((r) => r.data);

export const deleteReview = (id) =>
  api.delete(`/api/admin/reviews/${id}`).then((r) => r.data);

export const fetchCoupons = () => api.get("/api/admin/coupons").then((r) => r.data);

export const createCoupon = (data) =>
  api.post("/api/admin/coupons", data).then((r) => r.data);

export const deleteCoupon = (id) =>
  api.delete(`/api/admin/coupons/${id}`).then((r) => r.data);
