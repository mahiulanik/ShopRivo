import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { createCoupon, deleteCoupon, fetchCoupons } from "../../api/adminApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import PageLoader from "../../components/common/Loader";
import { formatPrice } from "../../utils/format";

const today = () => new Date().toISOString().slice(0, 10);

const discountLabel = (coupon) =>
  coupon.discount_type === "fixed"
    ? formatPrice(coupon.discount_value)
    : `${coupon.discount_value}%`;

const statusLabel = (coupon) => {
  if (!coupon.is_active) return "Inactive";
  if (coupon.expires_at && coupon.expires_at < today()) return "Expired";
  return "Active";
};

export function AdminCoupons() {
  const { title } = useOutletContext();
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchCoupons();
        const list = Array.isArray(res.coupons)
          ? res.coupons
          : res.coupons?.coupons || [];
        if (mounted) setCoupons(list);
      } catch (err) {
        toast.error(getErrorMessage(err, "Could not load coupons"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCoupon(toDelete.id);
      setCoupons((prev) => prev.filter((c) => c.id !== toDelete.id));
      toast.success(`Coupon ${toDelete.code} deleted`);
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete coupon"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: title }]} />

      <div className="admin-card p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold uppercase">Coupons</h2>
          <Link to="/admin/coupon/add" className="btn-admin">
            <Plus size={16} /> New Coupon
          </Link>
        </div>

        {loading ? (
          <PageLoader />
        ) : coupons.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No coupons"
            description="Create a coupon to offer discounts at checkout."
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="table-th">Coupon Code</th>
                  <th className="table-th">Discount</th>
                  <th className="table-th">Min. Shopping Amount</th>
                  <th className="table-th">Validity</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-50 dark:border-gray-800/60">
                    <td className="table-td font-mono font-semibold">{coupon.code}</td>
                    <td className="table-td">{discountLabel(coupon)}</td>
                    <td className="table-td">{formatPrice(coupon.min_amount)}</td>
                    <td className="table-td">{coupon.expires_at || "No expiry"}</td>
                    <td className="table-td">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          statusLabel(coupon) === "Active"
                            ? "bg-green-100 text-green-700"
                            : statusLabel(coupon) === "Expired"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {statusLabel(coupon)}
                      </span>
                    </td>
                    <td className="table-td text-right">
                      <button
                        onClick={() => setToDelete(coupon)}
                        className="btn-outline border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                        aria-label="Delete coupon"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete coupon">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Delete coupon <span className="font-mono font-semibold">{toDelete?.code}</span>? This
          cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setToDelete(null)} className="btn-outline">
            Cancel
          </button>
          <button onClick={confirmDelete} disabled={deleting} className="btn-danger">
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function AdminCouponForm() {
  const { title } = useOutletContext();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_amount: "",
    expires_at: "",
  });
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createCoupon({
        code: form.code,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_amount: form.min_amount === "" ? 0 : Number(form.min_amount),
        expires_at: form.expires_at || null,
      });
      toast.success(res.message || "Coupon created successfully");
      navigate("/admin/coupons");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not create coupon"));
    } finally {
      setSaving(false);
    }
  };

  const isPercentage = form.discount_type === "percentage";

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Coupon", to: "/admin/coupons" }, { label: title }]}
      />

      <form onSubmit={submit} className="admin-card max-w-4xl p-6">
        <h2 className="mb-6 border-b border-gray-100 pb-4 text-xl font-bold dark:border-gray-800">
          New Coupon
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              className="admin-input uppercase"
              required
              placeholder="e.g. SAVE10"
              value={form.code}
              name="code"
              onChange={onChange}
            />
          </div>
          <div>
            <label className="label">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <select
              className="admin-input"
              value={form.discount_type}
              name="discount_type"
              onChange={onChange}
            >
              <option value="percentage">Percentage off (%)</option>
              <option value="fixed">Fixed amount off (৳)</option>
            </select>
          </div>
          <div>
            <label className="label">
              {isPercentage ? "Discount Percentage" : "Discount Amount"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={isPercentage ? "100" : undefined}
              className="admin-input"
              required
              placeholder={isPercentage ? "e.g. 10" : "e.g. 500"}
              value={form.discount_value}
              name="discount_value"
              onChange={onChange}
            />
          </div>
          <div>
            <label className="label">Minimum Shopping Amount</label>
            <input
              type="number"
              min="0"
              className="admin-input"
              placeholder="0"
              value={form.min_amount}
              name="min_amount"
              onChange={onChange}
            />
          </div>
          <div>
            <label className="label">
              Validity <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="admin-input"
              required
              value={form.expires_at}
              name="expires_at"
              onChange={onChange}
            />
          </div>
        </div>
        <button type="submit" className="btn-admin mt-6" disabled={saving}>
          {saving ? "Saving..." : "Create Coupon"}
        </button>
      </form>
    </div>
  );
}
