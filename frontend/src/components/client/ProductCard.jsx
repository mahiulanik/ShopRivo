import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { useWishlist } from "../../context/WishlistContext";
import { LIMITED_STOCK_MAX, PLACEHOLDER_IMG } from "../../utils/constants";
import { formatPrice, getProductImage, resolveProductPrice, toNumber, truncate } from "../../utils/format";
import Rating from "../common/Rating";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();

  if (!product) return null;

  const stock = toNumber(product.stock);
  const image = getProductImage(product) || PLACEHOLDER_IMG;
  const defaultColor = product.colors?.[0]?.name || null;
  const defaultVariant = product.variants?.[0]?.label || null;
  const displayPrice = resolveProductPrice(product, defaultColor, defaultVariant);
  const wish = isWishlisted(product.id);

  const toggleWish = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please login to use your wishlist");
      navigate("/", { state: { openLogin: true } });
      return;
    }
    const added = toggleWishlist(product);
    toast[added ? "success" : "info"](
      added ? "Added to wishlist" : "Removed from wishlist"
    );
  };

  const addToCart = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please login to add items to your cart");
      navigate("/", { state: { openLogin: true } });
      return;
    }
    if (stock <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    const added = addItem(product, 1, {
      color: defaultColor,
      variant: defaultVariant,
      unitPrice: displayPrice,
    });
    toast[added ? "success" : "error"](
      added ? "Added to cart" : "Quantity increased successfully!"
    );
  };

  const buyNow = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please login to buy this product");
      navigate("/", { state: { openLogin: true } });
      return;
    }
    if (stock <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    navigate("/checkout", {
      state: {
        buyNow: {
          product,
          color: defaultColor,
          variant: defaultVariant,
          unitPrice: displayPrice,
          quantity: 1,
        },
      },
    });
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="relative h-36 bg-gray-50 p-3 sm:h-40 dark:bg-gray-800/50">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain transition group-hover:scale-105"
        />
        <button
          onClick={toggleWish}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition ${
            wish
              ? "bg-brand-700 text-white"
              : "bg-white text-gray-500 shadow-sm hover:text-brand-700 dark:bg-gray-800"
          }`}
          aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={15} className={wish ? "fill-white" : ""} />
        </button>
        {stock <= 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-600">
            Out of Stock
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          {product.category || "General"}
        </p>
        <h3 className="line-clamp-2 min-h-[36px] text-sm font-semibold leading-5">
          {truncate(product.name, 70)}
        </h3>
        <div className="flex items-center gap-2">
          <Rating value={product.ratings} size={13} />
          <span className="text-xs text-gray-500">{product.review_count ?? 0} Reviews</span>
        </div>
        <p
          className={`text-sm ${
            stock <= 0
              ? "text-red-500"
              : stock <= LIMITED_STOCK_MAX
                ? "font-medium text-amber-600 dark:text-amber-400"
                : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {stock <= 0
            ? "Out of Stock"
            : stock <= LIMITED_STOCK_MAX
              ? "Limited Stock"
              : "In Stock"}
        </p>
        <p className="text-base font-bold">{formatPrice(displayPrice)}</p>
        <div className="mt-auto flex gap-2">
          <button
            onClick={addToCart}
            className="btn-primary flex-1 justify-center py-2"
            disabled={stock <= 0}
          >
            <ShoppingBag size={15} /> Add to Cart
          </button>
          <button
            onClick={buyNow}
            className="btn-dark flex-1 justify-center py-2"
            disabled={stock <= 0}
          >
            Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
}
