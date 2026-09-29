import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useWishlist } from "../../context/WishlistContext";
import EmptyState from "../../components/common/EmptyState";
import { PLACEHOLDER_IMG } from "../../utils/constants";
import { formatPrice, getProductImage, resolveProductPrice, toNumber } from "../../utils/format";

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const moveToCart = (product) => {
    if (!isAuthenticated) {
      toast.info("Please login to add items to your cart");
      navigate("/", { state: { openLogin: true } });
      return;
    }
    const stock = toNumber(product.stock);
    if (stock <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    const color = product.colors?.[0]?.name || null;
    const variant = product.variants?.[0]?.label || null;
    const unitPrice = resolveProductPrice(product, color, variant);
    const added = addItem(product, 1, { color, variant, unitPrice });
    if (added) removeItem(product.id);
    toast[added ? "success" : "error"](
      added ? "Added to cart" : "Quantity increased in cart"
    );
  };

  return (
    <div className="container-x py-8">
      <div className="card p-6">
        <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold">
          <Heart size={24} /> My Wishlist
        </h1>

        {items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here for later."
            action={
              <Link to="/shop" className="btn-primary mt-2">
                Start Shopping
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {items.map((product) => {
              const image = getProductImage(product) || PLACEHOLDER_IMG;
              const color = product.colors?.[0]?.name || null;
              const variant = product.variants?.[0]?.label || null;
              const price = resolveProductPrice(product, color, variant);
              const stock = toNumber(product.stock);
              return (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <Link
                    to={`/product/${product.id}`}
                    className="h-20 w-20 shrink-0 rounded-lg bg-gray-50 p-2 dark:bg-gray-800"
                  >
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${product.id}`}
                      className="line-clamp-2 font-semibold hover:text-brand-700"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-wide text-gray-400">
                      {product.category || "General"}
                    </p>
                    <p
                      className={`mt-1 text-sm ${
                        stock > 0 ? "font-bold" : "text-red-500"
                      }`}
                    >
                      {stock > 0 ? formatPrice(price) : "Out of Stock"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveToCart(product)}
                      disabled={stock <= 0}
                      className="btn-primary py-2"
                    >
                      <ShoppingBag size={15} /> Move to Cart
                    </button>
                    <button
                      onClick={() => {
                        removeItem(product.id);
                        toast.info("Removed from wishlist");
                      }}
                      className="rounded-md p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      aria-label="Remove from wishlist"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
