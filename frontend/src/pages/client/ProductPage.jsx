import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Heart, HelpCircle, Share2, ShoppingBag, Trash2, Truck, Undo2 } from "lucide-react";
import { deleteReview, fetchSingleProduct, postReview } from "../../api/productApi";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { useWishlist } from "../../context/WishlistContext";
import PageLoader from "../../components/common/Loader";
import Avatar from "../../components/common/Avatar";
import Rating from "../../components/common/Rating";
import { LIMITED_STOCK_MAX, PLACEHOLDER_IMG } from "../../utils/constants";
import { formatPrice, getProductImage, resolveProductPrice, toNumber } from "../../utils/format";

export default function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const reviewFormRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setActiveImage(0);
    fetchSingleProduct(productId)
      .then((res) => {
        if (!active) return;
        const p = res.product;
        setProduct(p);
        setSelectedColor(p.colors?.[0]?.name || null);
        setSelectedVariant(p.variants?.[0]?.label || null);
      })
      .catch((err) => {
        toast.error(getErrorMessage(err, "Product not found"));
        navigate("/shop");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [productId, navigate, toast]);

  if (loading || !product) return <PageLoader label="Loading product..." />;

  const stock = toNumber(product.stock);
  const colors = product.colors || [];
  const variants = product.variants || [];

  // Gallery line: product images first, then each color's uploaded picture.
  const gallery = [...(product.images || [])];
  for (const c of colors) {
    if (c.image?.url && !gallery.some((g) => g.url === c.image.url)) {
      gallery.push({ ...c.image, colorName: c.name });
    }
  }
  const images = gallery.length ? gallery : [{ url: PLACEHOLDER_IMG }];
  const reviews = product.reviews || [];
  const unitPrice = resolveProductPrice(product, selectedColor, selectedVariant);
  const wish = isWishlisted(product.id);

  const toggleWish = () => {
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

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(Number(r.rating)) === star).length,
  }));

  const addToCart = () => {
    if (!isAuthenticated) {
      toast.info("Please login to add items to your cart");
      navigate("/", { state: { openLogin: true } });
      return;
    }
    if (stock <= 0) return toast.error("This product is out of stock");
    const added = addItem(product, 1, {
      color: selectedColor,
      variant: selectedVariant,
      unitPrice,
    });
    toast[added ? "success" : "error"](added ? "Added to cart" : "Quantity increased successfully!");
  };

  const buyNow = () => {
    if (!isAuthenticated) {
      toast.info("Please login to buy this product");
      navigate("/", { state: { openLogin: true } });
      return;
    }
    if (stock <= 0) return toast.error("This product is out of stock");
    navigate("/checkout", {
      state: {
        buyNow: {
          product,
          color: selectedColor,
          variant: selectedVariant,
          unitPrice,
          quantity: 1,
        },
      },
    });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please login to write a review");
      return;
    }
    setSubmitting(true);
    try {
      const res = await postReview(productId, { rating: Number(rating), comment });
      setProduct(res.product);
      setComment("");
      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not post review"));
    } finally {
      setSubmitting(false);
    }
  };

  const removeReview = async () => {
    setSubmitting(true);
    try {
      const res = await deleteReview(productId);
      setProduct(res.product);
      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete review"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-x py-8">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-xl border border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <img
              src={images[activeImage]?.url}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {images.map((img, i) => (
              <button
                key={img.public_id || i}
                onClick={() => setActiveImage(i)}
                className={`relative h-16 w-16 rounded-lg border bg-white p-1.5 transition dark:bg-gray-900 ${
                  i === activeImage ? "border-gray-900 dark:border-white" : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <img src={img.url} alt="" className="h-full w-full object-contain" />
                {img.colorName ? (
                  <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 py-px text-[8px] leading-none text-white">
                    {img.colorName}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2">
            <Rating value={product.ratings} size={16} />
            <span className="text-sm text-gray-500">({reviews.length})</span>
          </div>

          <div className="my-5 border-y border-gray-100 py-5 dark:border-gray-800">
            <p className="text-2xl font-bold">{formatPrice(unitPrice)}</p>
            <span
              className={`mt-2 inline-block rounded-md px-3 py-1 text-xs font-semibold ${
                stock <= 0
                  ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                  : stock <= LIMITED_STOCK_MAX
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                    : "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
              }`}
            >
              {stock <= 0
                ? "Out of Stock"
                : stock <= LIMITED_STOCK_MAX
                  ? `Only ${stock} left`
                  : "In Stock"}
            </span>

            {colors.length > 1 ? (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold">
                  Color{selectedColor ? `: ${selectedColor}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c.name);
                        if (c.image?.url) {
                          const idx = images.findIndex((g) => g.url === c.image.url);
                          if (idx >= 0) setActiveImage(idx);
                        }
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        selectedColor === c.name
                          ? "border-brand-700 bg-brand-700 text-white"
                          : "border-gray-200 text-gray-600 hover:border-brand-600 hover:text-brand-700 dark:border-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {variants.length > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold">Variant</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => setSelectedVariant(v.label)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        selectedVariant === v.label
                          ? "border-brand-700 bg-brand-700 text-white"
                          : "border-gray-200 text-gray-600 hover:border-brand-600 hover:text-brand-700 dark:border-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex gap-3">
            <button onClick={addToCart} className="btn-primary flex-1 py-3.5" disabled={stock <= 0}>
              <ShoppingBag size={17} /> Add to Cart
            </button>
            <button onClick={buyNow} className="btn-dark flex-1 py-3.5" disabled={stock <= 0}>
              Buy Now
            </button>
            <button
              onClick={toggleWish}
              className={`flex h-[50px] w-[50px] items-center justify-center rounded-lg border transition ${
                wish
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-gray-300 text-gray-500 hover:border-brand-600 hover:text-brand-700 dark:border-gray-700"
              }`}
              aria-label={wish ? "Remove from wishlist" : "Wishlist"}
            >
              <Heart size={18} className={wish ? "fill-white" : ""} />
            </button>
          </div>

          <div className="mt-6 rounded-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm font-semibold dark:border-gray-800">
              {product.name}: Characteristics
              <ChevronDown size={16} />
            </div>
            <div className="space-y-2 px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="font-semibold">{product.category || "--"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ratings:</span>
                <span className="font-semibold">{Number(product.ratings || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stock:</span>
                <span className="font-semibold">{stock > 0 ? "Available" : "Unavailable"}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-2"><Share2 size={15} /> Share</span>
            <span className="flex items-center gap-2"><HelpCircle size={15} /> Ask a question</span>
          </div>

          <div className="mt-5 divide-y divide-gray-100 rounded-lg border border-gray-100 text-sm dark:divide-gray-800 dark:border-gray-800">
            <div className="flex items-start gap-3 p-4">
              <Truck size={20} className="text-orange-500" />
              <div>
                <p className="font-semibold">Free Delivery</p>
                <p className="text-xs text-gray-500">
                  Free shipping available on orders above ৳3,000.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4">
              <Undo2 size={20} className="text-orange-500" />
              <div>
                <p className="font-semibold">Return Delivery</p>
                <p className="text-xs text-gray-500">Free 7 days delivery returns.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-12">
        <h2 className="text-xl font-bold uppercase">Description</h2>
        <div className="mt-4 rounded-xl border border-gray-100 p-6 dark:border-gray-800">
          <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">
            {product.description || "No description available."}
          </p>
        </div>
      </div>

      {/* Reviews and Ratings */}
      <div className="mt-10">
        <h2 className="text-xl font-bold uppercase">Reviews and Ratings</h2>
        <div className="mt-4 rounded-xl border border-gray-100 p-6 dark:border-gray-800">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            <div className="text-center sm:w-48">
              <p className="text-5xl font-extrabold">{Number(product.ratings || 0).toFixed(1)}</p>
              <div className="mt-2 flex justify-center">
                <Rating value={product.ratings} size={18} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                ({reviews.length} Ratings &amp; Reviews)
              </p>
            </div>

            <div className="flex-1 space-y-1.5">
              {distribution.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-6">{star} ★</span>
                  <div className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{
                        width: `${reviews.length ? (count / reviews.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-gray-500">{count}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                reviewFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              className="btn-outline hidden sm:block"
            >
              Write Review
            </button>
          </div>

          <form
            ref={reviewFormRef}
            onSubmit={submitReview}
            className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800"
          >
            <h3 className="mb-3 font-bold">Write a review</h3>
            <div className="mb-4 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition ${
                    star <= rating ? "text-amber-400" : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <label className="label">Review</label>
            <textarea
              className="input min-h-[110px] resize-y"
              placeholder="Write your comment here..."
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="mt-4">
              <button type="submit" disabled={submitting} className="btn-admin">
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Reviews are allowed for customers who purchased this product.
            </p>
          </form>

          <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800">
            <p className="mb-5 font-semibold">Reviews</p>
            <div className="space-y-5">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet. Be the first to review.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.review_id} className="flex gap-3">
                    <Avatar
                      src={review.reviewer?.avatar?.url}
                      name={review.reviewer?.name}
                      className="h-11 w-11"
                      shape="rounded-lg"
                      fallbackClassName="bg-brand-100 text-sm text-brand-700"
                      fallbackLetter="A"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Rating value={review.rating} size={13} />
                        {review.reviewer?.id === user?.id ? (
                          <span className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={removeReview}
                              disabled={submitting}
                              className="rounded-md p-1 text-gray-400 transition hover:text-red-600 disabled:opacity-50"
                              title="Delete my review"
                              aria-label="Delete my review"
                            >
                              <Trash2 size={16} />
                            </button>
                            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                              Your review
                            </span>
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-semibold">
                        {review.reviewer?.name || "Customer"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link to="/shop" className="text-sm font-medium text-brand-700 hover:underline">
          ← Continue shopping
        </Link>
      </div>
    </div>
  );
}
