import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import { fetchSingleOrder, updateOrderStatus } from "../../api/orderApi";
import { fetchAllOrders } from "../../api/orderApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import PageLoader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { ORDER_STATUSES, PLACEHOLDER_IMG } from "../../utils/constants";
import { formatDate, formatPrice, toNumber } from "../../utils/format";

export default function AdminOrderDetail() {
  const { orderId } = useParams();
  const { title } = useOutletContext();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const orderPromise = fetchSingleOrder(orderId);
    const allPromise = fetchAllOrders().catch(() => ({ orders: [] }));

    Promise.all([orderPromise, allPromise])
      .then(([singleRes, allRes]) => {
        if (!active) return;
        const detailed = singleRes.order;
        const listItem = (allRes.orders || []).find((o) => o.id === orderId);
        setOrder(detailed);
        setPayment(listItem?.payment || null);
        setStatus(detailed.order_status);
      })
      .catch((err) => {
        toast.error(getErrorMessage(err, "Order not found"));
        navigate("/admin/orders");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [orderId, navigate, toast]);

  const saveStatus = async () => {
    setSaving(true);
    try {
      const res = await updateOrderStatus(orderId, status);
      const updated = res.order || {};
      setOrder((prev) => ({ ...prev, order_status: updated.order_status ?? status }));

      // payment status can change with the order status (e.g. COD -> Paid on Delivered)
      fetchAllOrders()
        .then((r) => {
          const item = (r.orders || []).find((o) => o.id === orderId);
          if (item?.payment) setPayment(item.payment);
        })
        .catch(() => {});

      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update status"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !order) return <PageLoader label="Loading order..." />;

  const shipping = order.shipping_info || {};
  const discount = toNumber(order.discount || 0);
  const subtotal = toNumber(order.total_price) - toNumber(order.shipping_price) + discount;
  const shippingFee = toNumber(order.shipping_price);

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Order", to: "/admin/orders" }, { label: "Order Status" }]}
      />

      <div className="admin-card p-6">
        <h2 className="mb-4 border-b border-gray-100 pb-4 font-bold text-admin-600 dark:border-gray-800">
          Order Details
        </h2>

        <div className="mb-6 space-y-1.5 text-sm">
          <p>
            <span className="font-semibold">Order Id:</span>{" "}
            <span className="font-mono text-xs">{order.id}</span>
          </p>
          <p>
            <span className="font-semibold">Transaction Id:</span>{" "}
            <span className="font-mono text-xs">{payment?.payment_intent_id || "—"}</span>
          </p>
          <p>
            <span className="font-semibold">Status:</span> {order.order_status}
          </p>
          <p>
            <span className="font-semibold">Payment:</span> {payment?.payment_type || "—"} (
            {payment?.payment_status || "Unknown"})
          </p>
        </div>

        <div className="mb-8 overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-sm font-bold dark:border-gray-800 dark:bg-gray-800/50">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Quantity</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.order_items || []).map((item) => (
                <tr key={item.order_item_id} className="border-b border-gray-50 dark:border-gray-800/60">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || PLACEHOLDER_IMG}
                        alt=""
                        className="h-14 w-14 rounded-lg bg-gray-100 object-contain p-1 dark:bg-gray-800"
                      />
                      <div>
                        <span className="font-medium">{item.title}</span>
                        {item.color || item.variant ? (
                          <span className="block text-xs font-normal text-gray-500">
                            {[item.color, item.variant].filter(Boolean).join(" · ")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm">{formatPrice(item.price)}</td>
                  <td className="px-4 py-4 text-center text-sm">{item.quantity}</td>
                  <td className="px-4 py-4 text-right text-sm font-semibold">
                    {formatPrice(toNumber(item.price) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-100 p-5 dark:border-gray-800">
            <h3 className="mb-5 font-bold">Shipping Address</h3>
            <dl className="space-y-3 text-sm">
              {[
                ["Name", shipping.contact_name],
                ["Phone", shipping.phone],
                ["Address", [shipping.address, shipping.area].filter(Boolean).join(", ")],
                ["City", shipping.city],
                ["District", shipping.district],
                ["Pin Code", shipping.pincode],
                ["Country", shipping.country],
                ["Placed on", formatDate(order.created_at, true)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-gray-50 pb-2 last:border-0 dark:border-gray-800/60">
                  <dt className="font-semibold">{label}</dt>
                  <dd className="text-right text-gray-500">{value || "--"}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-lg border border-gray-100 p-5 dark:border-gray-800">
            <h3 className="mb-5 font-bold">Order Summary</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal</dt>
                <dd className="font-semibold">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Shipping</dt>
                <dd className="font-semibold">
                  {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
                </dd>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between text-green-600">
                  <dt className="font-medium">Coupon ({order.coupon_code})</dt>
                  <dd className="font-semibold">−{formatPrice(discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold dark:border-gray-800">
                <dt>Total</dt>
                <dd>{formatPrice(order.total_price)}</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
              <h3 className="mb-3 font-bold">Order Status</h3>
              <select
                className="admin-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button onClick={saveStatus} disabled={saving} className="btn-admin mt-3">
                <Save size={15} /> {saving ? "Saving..." : "Save Status"}
              </button>
              <p className="mt-3 text-xs text-gray-400">
                Payment status:{" "}
                <StatusBadge status={payment?.payment_status || "—"} className="ml-1" />
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link to="/admin/orders" className="text-sm font-medium text-admin-600 hover:underline">
            ← Back to orders
          </Link>
        </div>
      </div>
    </div>
  );
}
