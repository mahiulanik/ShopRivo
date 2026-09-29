import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
const LEGACY_CART_KEY = "shopcart_cart";

const storageKey = (userId) => `shopcart_cart_${userId}`;

const readCart = (userId) => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const cartItemKey = (item) =>
  `${item.product?.id}|${item.color || ""}|${item.variant || ""}`;

export function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [items, setItems] = useState(() => readCart(userId));

  // Remove the old shared (account-less) cart key.
  useEffect(() => {
    localStorage.removeItem(LEGACY_CART_KEY);
  }, []);

  // Persist only under the signed-in account; guests have no stored cart.
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
  }, [items, userId]);

  // Switch carts when the signed-in account changes (login / logout).
  useEffect(() => {
    setItems(readCart(userId));
  }, [userId]);

  const addItem = useCallback(
    (product, quantity = 1, options = {}) => {
      if (!userId) return false;

      const { color = null, variant = null, unitPrice } = options;
      const key = `${product.id}|${color || ""}|${variant || ""}`;
      const price = Number(unitPrice ?? product.price ?? 0);
      let added = false;

      setItems((prev) => {
        const existing = prev.find((item) => cartItemKey(item) === key);
        const stock = Number(product.stock || 0);
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, stock || existing.quantity + quantity);
          added = nextQty > existing.quantity;
          return prev.map((item) =>
            cartItemKey(item) === key ? { ...item, quantity: nextQty } : item
          );
        }
        added = true;
        return [
          ...prev,
          { product, quantity: Math.max(1, quantity), color, variant, unitPrice: price },
        ];
      });
      return added;
    },
    [userId]
  );

  const updateQuantity = useCallback((key, quantity) => {
    setItems((prev) =>
      prev
        .map((item) =>
          cartItemKey(item) === key ? { ...item, quantity: Math.max(1, Number(quantity)) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((item) => cartItemKey(item) !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (productId) => items.some((item) => item.product.id === productId),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isInCart,
    }),
    [items, addItem, updateQuantity, removeItem, clearCart, isInCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
