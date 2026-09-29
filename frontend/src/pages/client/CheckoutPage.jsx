import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  CreditCard,
  Lock,
  MapPin,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { abandonOrder, confirmOrderPayment, placeOrder } from "../../api/orderApi";
import { deleteAddress, fetchAddress } from "../../api/addressApi";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import PageLoader from "../../components/common/Loader";
import CouponSection from "../../components/client/CouponSection";
import AddressModal from "../../components/client/AddressModal";
import { COUNTRIES, PAYMENT_TYPES, PLACEHOLDER_IMG } from "../../utils/constants";
import { calcShipping, calcSubtotal, formatPrice, getProductImage, toNumber } from "../../utils/format";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const stripeCardStyle = {
  style: {
    base: {
      fontSize: "15px",
      color: "#111827",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#dc2626" },
  },
};

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#635bff] focus:outline-none focus:ring-1 focus:ring-[#635bff]";

function CheckoutForm() {
  const { items: cartItems, clearCart } = useCart();
  const location = useLocation();
  const buyNowItem = location.state?.buyNow;
  const items = buyNowItem ? [buyNowItem] : cartItems;
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [savedAddress, setSavedAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [paymentType, setPaymentType] = useState(PAYMENT_TYPES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [coupon, setCoupon] = useState(location.state?.coupon || null);

  const subtotal = calcSubtotal(items);
  const shipping = calcShipping(subtotal);
  const postalCode = savedAddress?.postal_code ?? savedAddress?.pincode ?? "";
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const loadAddress = async () => {
    try {
      const res = await fetchAddress();
      setSavedAddress(res.address || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load your address"));
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setAddressLoading(false);
      return;
    }
    loadAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const selectedAddress = savedAddress;

  const openAdd = () => {
    setEditingAddress(null);
    setShowAddressModal(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteAddress(toDelete.id);
      toast.success("Address deleted");
      setToDelete(null);
      await loadAddress();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete address"));
    } finally {
      setDeleting(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!selectedAddress) {
      toast.error("Please add a delivery address");
      return;
    }

    if (paymentType === "Online" && (!stripe || !elements)) {
      toast.error("Payment gateway is not ready. Please try again.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        contact_name: selectedAddress.contact_name,
        phone: selectedAddress.phone,
        country: selectedAddress.country || "Bangladesh",
        district: selectedAddress.district,
        area: selectedAddress.area || null,
        city: selectedAddress.city,
        address: selectedAddress.address,
        pincode: selectedAddress.pincode ?? selectedAddress.postal_code ?? "",
        payment_type: paymentType,
        coupon_code: coupon?.code || null,
        orderedItems: items.map((item) => ({
          product: { id: item.product.id },
          quantity: Number(item.quantity),
          color: item.color || null,
          variant: item.variant || null,
        })),
      };

      const res = await placeOrder(payload);

      const placed = res.order || {};
      const newOrderId = placed.order?.id ?? placed.id ?? null;
      const clientSecret = placed.clientSecret ?? res.clientSecret ?? null;

      if (paymentType === "Online") {
        if (!clientSecret) {
          // payment setup failed — don't keep an unpaid order around
          if (newOrderId) abandonOrder(newOrderId).catch(() => {});
          toast.error("Payment gateway is not ready. Please try again.");
          setSubmitting(false);
          return;
        }

        const billingDetails = {};
        if (user?.name) billingDetails.name = user.name;
        if (user?.email) billingDetails.email = user.email;
        const phoneDigits = (selectedAddress?.phone || "").replace(/[^0-9]/g, "");
        if (phoneDigits) {
          billingDetails.phone = phoneDigits.startsWith("880")
            ? `+${phoneDigits}`
            : `+880${phoneDigits.replace(/^0+/, "")}`;
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardNumberElement),
              billing_details: Object.keys(billingDetails).length ? billingDetails : undefined,
            },
          }
        );

        if (error) {
          // declined card — remove the unpaid order so it is never stored
          if (newOrderId) abandonOrder(newOrderId).catch(() => {});
          toast.error(error.message || "Payment failed");
          setSubmitting(false);
          return;
        }
        if (paymentIntent?.status !== "succeeded") {
          toast.info("Payment is processing. You will see it in your orders shortly.");
        } else {
          toast.success("Payment successful");
          // mark it paid right away (webhook is the backup)
          if (newOrderId) confirmOrderPayment(newOrderId).catch(() => {});
        }
      } else {
        toast.success(res.message || "Order placed successfully");
      }

      if (!buyNowItem) {
        clearCart();
      }
      navigate(`/order-success/${newOrderId}`, {
        state: { orderId: newOrderId, paymentType },
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not place the order"));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-x py-10">
        <div className="card">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Add products before checking out."
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

  if (!user) {
    return (
      <div className="container-x py-10">
        <div className="card">
          <EmptyState
            icon={Truck}
            title="Please log in to checkout"
            description="You need an account to choose a delivery address and place an order."
            action={
              <button
                className="btn-primary mt-2"
                onClick={() => navigate("/", { state: { openLogin: true } })}
              >
                Login
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Delivery address */}
          <section className="card p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h1 className="flex items-center gap-2 text-xl font-bold">
                <Truck size={22} /> Delivery Address
              </h1>
            </div>

            {addressLoading ? (
              <PageLoader label="Loading address..." />
            ) : !savedAddress ? (
              <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center dark:border-gray-700">
                <MapPin size={30} className="mx-auto text-gray-400" />
                <p className="mt-3 font-semibold">No delivery address yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  Save your delivery address once and it will be used for every order.
                </p>
                <button type="button" onClick={openAdd} className="btn-primary mt-4">
                  <Plus size={16} /> Add Delivery Address
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-brand-700 bg-brand-50/70 p-4 dark:bg-brand-950/30">
                <div className="flex gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{savedAddress.contact_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {savedAddress.phone}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {[
                        savedAddress.address,
                        savedAddress.area,
                        savedAddress.city,
                        `${savedAddress.district}${postalCode ? ` - ${postalCode}` : ""}`,
                        savedAddress.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddress(savedAddress);
                        setShowAddressModal(true);
                      }}
                      className="rounded-md p-1.5 text-gray-400 transition hover:bg-white hover:text-brand-700 dark:hover:bg-gray-800"
                      aria-label="Edit address"
                      title="Edit address"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(savedAddress)}
                      className="rounded-md p-1.5 text-gray-400 transition hover:bg-white hover:text-red-600 dark:hover:bg-gray-800"
                      aria-label="Delete address"
                      title="Delete address"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Payment method */}
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold">Payment Method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm transition ${
                    paymentType === type
                      ? "border-brand-700 bg-brand-50 text-brand-800 dark:bg-brand-950/40"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_type"
                    checked={paymentType === type}
                    onChange={() => setPaymentType(type)}
                    className="h-4 w-4 text-brand-700 focus:ring-brand-600"
                  />
                  <span className="font-semibold">{type}</span>
                  {type === "Online" ? <Lock size={13} className="ml-auto text-gray-400" /> : null}
                </label>
              ))}
            </div>

            {paymentType === "Online" ? (
              <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5 text-gray-900 dark:border-gray-700">
                <div className="mt-1">
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Card number
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus-within:border-[#635bff] focus-within:ring-1 focus-within:ring-[#635bff]">
                    <div className="min-w-0 flex-1">
                      <CardNumberElement options={{ ...stripeCardStyle, disableLink: true }} />
                    </div>
                    <span className="shrink-0 rounded bg-white text-[10px] font-bold italic text-[#1a1f71]">
                      VISA
                    </span>
                    <span className="relative h-4 w-6 shrink-0">
                      <span className="absolute left-0 top-0 h-4 w-4 rounded-full bg-[#eb001b]" />
                      <span className="absolute right-0 top-0 h-4 w-4 rounded-full bg-[#f79e1b] opacity-90" />
                    </span>
                    <span className="shrink-0 rounded bg-[#2e77bc] px-1 text-[8px] font-bold text-white">
                      AMEX
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      Expiry date
                    </label>
                    <div className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus-within:border-[#635bff] focus-within:ring-1 focus-within:ring-[#635bff]">
                      <CardExpiryElement options={stripeCardStyle} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      Security code
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus-within:border-[#635bff] focus-within:ring-1 focus-within:ring-[#635bff]">
                      <div className="min-w-0 flex-1">
                        <CardCvcElement options={stripeCardStyle} />
                      </div>
                      <CreditCard size={16} className="shrink-0 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">Country</label>
                  <select
                    className={inputCls}
                    key={selectedAddress?.country || "BD"}
                    defaultValue={selectedAddress?.country || "Bangladesh"}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="mb-4 text-lg font-bold">Order Summary</h2>

            <div className="max-h-64 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-md bg-gray-50 p-1 dark:bg-gray-800">
                    <img
                      src={getProductImage(item.product) || PLACEHOLDER_IMG}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold">
                    {formatPrice(toNumber(item.unitPrice ?? item.product.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
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
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold dark:border-gray-800">
                <span>Total Price</span>
                <span>{formatPrice(total)}</span>
              </div>
              <CouponSection
                subtotal={subtotal}
                coupon={coupon}
                onApply={setCoupon}
                onRemove={() => setCoupon(null)}
                cta="dark"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-dark mt-5 w-full py-3">
              {submitting ? "Placing order..." : "Place Order"}
            </button>
            <Link to="/cart" className="mt-3 block text-center text-sm text-gray-500 hover:text-brand-700">
              ← Back to cart
            </Link>
          </div>
        </aside>
      </form>

      <AddressModal
        open={showAddressModal}
        address={editingAddress}
        onClose={() => setShowAddressModal(false)}
        onSaved={() => loadAddress()}
      />

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete address">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Delete this address for{" "}
          <span className="font-semibold">{toDelete?.contact_name}</span>? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setToDelete(null)} className="btn-outline">
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={deleting}
            className="btn-danger disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
