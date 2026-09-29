import api from "./client";

export const validateCoupon = (code, subtotal) =>
  api.post("/api/coupon/validate", { code, subtotal }).then((r) => r.data);
