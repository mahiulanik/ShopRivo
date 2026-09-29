import { CURRENCY, SHIPPING_FEE, SHIPPING_THRESHOLD } from "./constants";

export const formatPrice = (value) => {
  const amount = Number(value || 0);
  return `${CURRENCY}${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
};

export const formatDate = (value, withTime = false) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

export const timeAgo = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return formatDate(value);
};

export const calcSubtotal = (items) =>
  items.reduce(
    (sum, item) => sum + Number(item.unitPrice ?? item.product?.price ?? 0) * item.quantity,
    0
  );

export const resolveProductPrice = (product, colorName, variantLabel) => {
  const base = Number(product?.price || 0);
  const colorOption = (product?.colors || []).find((c) => c.name === colorName);
  const variantOption = (product?.variants || []).find((v) => v.label === variantLabel);
  const colorPrice = colorOption ? Number(colorOption.price) : base;
  const variantPrice = variantOption ? Number(variantOption.price) : base;
  return variantPrice + (colorPrice - base);
};

export const calcShipping = (subtotal) =>
  subtotal === 0 || subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

export const calcTotal = (items) => calcSubtotal(items) + calcShipping(calcSubtotal(items));

export const getProductImage = (product, index = 0) =>
  product?.images?.[index]?.url ||
  product?.images?.[0]?.url ||
  (product?.colors || []).find((c) => c.image?.url)?.image?.url ||
  "";

export const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const truncate = (text, length = 60) =>
  !text ? "" : text.length > length ? `${text.slice(0, length)}…` : text;
