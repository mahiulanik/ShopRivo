import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { cartItemKey, useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { useWishlist } from "../../context/WishlistContext";
import EmptyState from "../../components/common/EmptyState";
import CouponSection from "../../components/client/CouponSection";
import { PLACEHOLDER_IMG } from "../../utils/constants";
import { calcShipping, calcSubtotal, formatPrice, getProductImage, toNumber } from "../../utils/format";

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState(null);

  const subtotal = calcSubtotal(items);
  const shipping = calcShipping(subtotal);
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const changeQty = (item, next) => {
    const stock = toNumber(item.product.stock);
    if (next > stock) {
      toast.error("Cannot add more than available stock");
      return;
    }
    updateQuantity(cartItemKey(item), next);
    toast.success(next > item.quantity ? "Quantity increased successfully!" : "Quantity updated");
  };

  if (items.length === 0) {
    return (
      <div className="container-x py-10">
        <h1 className="mb-1 flex items-center gap-3 text-2xl font-bold">
          <ShoppingCart size={26} /> Shopping Cart
        </h1>
        <p className="mb-6 mt-3 text-sm font-medium text-gray-500">Order Items(0)</p>
        <div className="card">
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Browse the shop and add products to your cart."
            action={
              <Link to="/shop" className="btn-primary mt-2">
                Go to Shop
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <h1 className="mb-1 flex items-center gap-3 text-2xl font-bold">
        <ShoppingCart size={26} /> Shopping Cart
      </h1>
      <p className="mb-6 mt-3 text-sm font-medium text-gray-500">Order Items({items.length})</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="card p-4 sm:p-5">
              <div className="flex gap-4">
                <Link to={`/product/${item.product.id}`} className="h-24 w-24 shrink-0 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                  <img
                    src={
                      (item.product.colors || []).find((c) => c.name === item.color)?.image
                        ?.url ||
                      getProductImage(item.product) ||
                      PLACEHOLDER_IMG
                    }
                    alt={item.product.name}
                    className="h-full w-full object-contain"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/product/${item.product.id}`}
                        className="line-clamp-2 font-semibold hover:text-brand-700"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-1 text-sm text-gray-500">
                        Color: {item.color || item.product.color || "Standard"}
                      </p>
                      {item.variant ? (
                        <p className="text-sm text-gray-500">Variant: {item.variant}</p>
                      ) : null}
                    </div>
                    <p className="whitespace-nowrap font-bold">
                      {formatPrice(toNumber(item.unitPrice ?? item.product.price) * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const added = toggleWishlist(item.product);
                          toast[added ? "success" : "info"](
                            added ? "Added to wishlist" : "Removed from wishlist"
                          );
                        }}
                        className={`rounded-md p-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
                          isWishlisted(item.product.id)
                            ? "text-brand-700"
                            : "text-gray-400"
                        }`}
                        aria-label="Wishlist"
                      >
                        <Heart
                          size={16}
                          className={isWishlisted(item.product.id) ? "fill-current" : ""}
                        />
                      </button>
                      <button
                        onClick={() => {
                          removeItem(cartItemKey(item));
                          toast.success("Item removed from cart");
                        }}
                        className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                        aria-label="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => changeQty(item, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700"
                        aria-label="Decrease"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => changeQty(item, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700"
                        aria-label="Increase"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Product Price</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="font-semibold">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              {coupon ? (
                <div className="flex justify-between text-accent-700">
                  <span className="font-medium">Coupon ({coupon.code})</span>
                  <span className="font-semibold">−{formatPrice(discount)}</span>
                </div>
              ) : null}
              <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
                <div className="flex justify-between text-base font-bold">
                  <span>Total Price</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <CouponSection
                subtotal={subtotal}
                coupon={coupon}
                onApply={setCoupon}
                onRemove={() => setCoupon(null)}
              />
            </div>
            <button
              onClick={() => navigate("/checkout", { state: coupon ? { coupon } : undefined })}
              className="btn-primary mt-5 w-full py-3"
            >
              Proceed to Checkout
            </button>
            <Link to="/shop" className="mt-3 block text-center text-sm text-gray-500 hover:text-brand-700">
              Continue Shopping
            </Link>
          </div>

          <div className="card p-5 text-sm text-gray-600 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-white">Delivery info</p>
            <p className="mt-2">
              Free delivery on orders above ৳3,000. A flat ৳80 delivery fee applies below that.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
