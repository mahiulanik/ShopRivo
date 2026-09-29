import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);
const LEGACY_WISHLIST_KEY = "shopcart_wishlist";

const storageKey = (userId) => `shoprivo_wishlist_${userId}`;
const legacyStorageKey = (userId) => `shopcart_wishlist_${userId}`;

const readWishlist = (userId) => {
  if (!userId) return [];
  try {
    const key = storageKey(userId);
    let raw = localStorage.getItem(key);
    if (!raw) {
      // One-time migration from the pre-rebrand key.
      const legacyRaw = localStorage.getItem(legacyStorageKey(userId));
      if (legacyRaw) {
        localStorage.setItem(key, legacyRaw);
        localStorage.removeItem(legacyStorageKey(userId));
        raw = legacyRaw;
      }
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [items, setItems] = useState(() => readWishlist(userId));

  // Remove the old shared (account-less) wishlist key.
  useEffect(() => {
    localStorage.removeItem(LEGACY_WISHLIST_KEY);
  }, []);

  // Persist only under the signed-in account; guests have no stored wishlist.
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
  }, [items, userId]);

  // Switch wishlists when the signed-in account changes (login / logout).
  useEffect(() => {
    setItems(readWishlist(userId));
  }, [userId]);

  const isWishlisted = useCallback(
    (productId) => items.some((item) => item.id === productId),
    [items]
  );

  const toggleWishlist = useCallback(
    (product) => {
      if (!userId) return false;

      const exists = items.some((item) => item.id === product.id);
      setItems((prev) =>
        exists ? prev.filter((item) => item.id !== product.id) : [...prev, product]
      );
      return !exists;
    },
    [items, userId]
  );

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const clearWishlist = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      isWishlisted,
      toggleWishlist,
      removeItem,
      clearWishlist,
    }),
    [items, isWishlisted, toggleWishlist, removeItem, clearWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
