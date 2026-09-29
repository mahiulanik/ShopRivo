import api from "./client";

export const register = (data) => api.post("/api/auth/register", data).then((r) => r.data);

export const login = (data) => api.post("/api/auth/login", data).then((r) => r.data);

export const logout = () => api.post("/api/auth/logout").then((r) => r.data);

export const getMe = () => api.get("/api/auth/user").then((r) => r.data);

export const forgotPassword = (email, frontendUrl) =>
  api
    .post(`/api/auth/forgot-password?frontendUrl=${encodeURIComponent(frontendUrl)}`, { email })
    .then((r) => r.data);

export const resetPassword = (token, password, confirmPassword) =>
  api.put(`/api/auth/password/reset/${token}`, { password, confirmPassword }).then((r) => r.data);

export const changePassword = (data) =>
  api.put("/api/auth/password/change", data).then((r) => r.data);

export const updateProfile = (formData) =>
  api
    .patch("/api/auth/profile/update", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
