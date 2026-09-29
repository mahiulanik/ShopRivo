import { useEffect, useState } from "react";
import { Ticket, X } from "lucide-react";
import { validateCoupon } from "../../api/couponApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { formatPrice } from "../../utils/format";

export default function CouponSection({ subtotal, coupon, onApply, onRemove, cta = "primary" }) {
  const toast = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const appliedCode = coupon?.code;

  // Keep the discount in sync when the subtotal changes (qty edit, item removed)
  useEffect(() => {
    if (!appliedCode) return undefined;
    let stale = false;
    (async () => {
      try {
        const res = await validateCoupon(appliedCode, subtotal);
        if (!stale) onApply({ code: res.coupon.code, discount: res.discount });
      } catch (err) {
        if (!stale) {
          onRemove();
          toast.info(getErrorMessage(err, "Coupon is no longer valid"));
        }
      }
    })();
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, appliedCode]);

  const apply = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("Enter a coupon code");
      return;
    }
    setLoading(true);
    try {
      const res = await validateCoupon(trimmed, subtotal);
      onApply({ code: res.coupon.code, discount: res.discount });
      setCode("");
      toast.success(`Coupon ${res.coupon.code} applied`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not apply coupon"));
    } finally {
      setLoading(false);
    }
  };

  const remove = () => {
    onRemove();
    setCode("");
    toast.info("Coupon removed");
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2.5 text-sm dark:border-accent-900 dark:bg-accent-950/40">
        <span className="flex min-w-0 items-center gap-2">
          <Ticket size={16} className="shrink-0 text-accent-700" />
          <span className="truncate">
            Coupon <span className="font-mono font-semibold">{coupon.code}</span>{" "}
            <span className="text-gray-500 dark:text-gray-400">applied</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="font-bold text-accent-700">−{formatPrice(coupon.discount)}</span>
          <button
            type="button"
            onClick={remove}
            className="rounded-md p-1 text-gray-400 transition hover:bg-accent-100 hover:text-red-600 dark:hover:bg-accent-950"
            aria-label="Remove coupon"
            title="Remove coupon"
          >
            <X size={15} />
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="mt-1">
      <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        Have any coupon?
      </p>
      <div className="flex gap-2">
        <input
          className="input min-w-0 flex-1 uppercase"
          placeholder="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          aria-label="Coupon code"
        />
        <button
          type="button"
          onClick={apply}
          className={`btn shrink-0 border px-4 ${
            cta === "dark"
              ? "border-gray-300 bg-white text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-black dark:hover:bg-black dark:hover:text-white"
              : "border-gray-300 bg-white text-gray-700 hover:border-brand-700 hover:bg-brand-700 hover:text-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-brand-700 dark:hover:bg-brand-700 dark:hover:text-white"
          }`}
          disabled={loading}
        >
          {loading ? "Checking..." : "Apply"}
        </button>
      </div>
    </div>
  );
}
