import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListOrdered, X } from "lucide-react";
import { fetchMyOrders } from "../../api/orderApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import PageLoader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import { PLACEHOLDER_IMG } from "../../utils/constants";
import { formatDate, formatPrice, toNumber } from "../../utils/format";

export default function OrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchMyOrders()
      .then((res) => setOrders(res.orders || res.myOrders || []))
      .catch((err) => toast.error(getErrorMessage(err, "Failed to load orders")))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <PageLoader label="Loading your orders..." />;

  return (
    <div className="container-x py-8">
      <div className="card p-6">
        <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold">
          <ListOrdered size={24} /> Order List
        </h1>

        {orders.length === 0 ? (
          <EmptyState
            icon={ListOrdered}
            title="No orders yet"
            description="When you place an order it will show up here."
            action={
              <Link to="/shop" className="btn-primary mt-2">
                Start Shopping
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[840px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-sm text-gray-500 dark:border-gray-800">
                  <th className="py-3 pr-4 font-medium">Product Name</th>
                  <th className="py-3 pr-4 font-medium">Image</th>
                  <th className="py-3 pr-4 font-medium">Date</th>
                  <th className="py-3 pr-4 font-medium">Items</th>
                  <th className="py-3 pr-4 font-medium">Total</th>
                  <th className="py-3 pr-4 font-medium">Payment</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const firstItem = order.order_items?.[0];
                  const extraCount = (order.order_items?.length || 0) - 1;
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 text-sm transition hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/40"
                    >
                      <td className="py-3.5 pr-4">
                        <span className="line-clamp-1">{firstItem?.title || "—"}</span>
                        {extraCount > 0 ? (
                          <span className="block text-xs text-gray-500">
                            +{extraCount} more
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3.5 pr-4">
                        <img
                          src={firstItem?.image || PLACEHOLDER_IMG}
                          alt=""
                          className="h-10 w-10 rounded-md bg-gray-50 object-contain p-1 dark:bg-gray-800"
                        />
                      </td>
                      <td className="py-3.5 pr-4">{formatDate(order.created_at)}</td>
                      <td className="py-3.5 pr-4">{order.order_items?.length || 0}</td>
                      <td className="py-3.5 pr-4 font-semibold">{formatPrice(order.total_price)}</td>
                      <td className="py-3.5 pr-4">
                        <span className="text-xs text-gray-500">
                          {order.payment?.payment_type || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <StatusBadge status={order.order_status} />
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => setSelected(order)}
                          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:border-brand-600 hover:text-brand-700 dark:border-gray-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} width="max-w-3xl">
        {selected ? (
          <div>
            <h2 className="pr-8 text-lg font-bold">
              Order Details - <span className="font-mono text-sm">{selected.id}</span>
            </h2>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-gray-500">Customer:</span>{" "}
                <span className="font-semibold">{selected.shipping_info?.contact_name}</span>
              </p>
              <p>
                <span className="text-gray-500">Phone:</span>{" "}
                <span className="font-semibold">{selected.shipping_info?.phone}</span>
              </p>
              <p>
                <span className="text-gray-500">Date:</span>{" "}
                <span className="font-semibold">{formatDate(selected.created_at)}</span>
              </p>
              <p>
                <span className="text-gray-500">Status:</span>{" "}
                <span className="font-semibold text-green-600">{selected.order_status}</span>
              </p>
              <p>
                <span className="text-gray-500">Payment:</span>{" "}
                <span className="font-semibold">
                  {selected.payment?.payment_type} ({selected.payment?.payment_status})
                </span>
              </p>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                    <th className="py-2 font-medium">Product</th>
                    <th className="py-2 font-medium">Quantity</th>
                    <th className="py-2 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.order_items || []).map((item) => (
                    <tr key={item.order_item_id} className="border-b border-gray-50 dark:border-gray-800/60">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || PLACEHOLDER_IMG}
                            alt=""
                            className="h-10 w-10 rounded-md bg-gray-50 object-contain p-1 dark:bg-gray-800"
                          />
                          <div>
                            <span className="line-clamp-1">{item.title}</span>
                            {item.color || item.variant ? (
                              <span className="block text-xs text-gray-500">
                                {[item.color, item.variant].filter(Boolean).join(" · ")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">{item.quantity}</td>
                      <td className="py-3">{formatPrice(toNumber(item.price) * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800/60">
                <p className="mb-2 font-semibold">Shipping Address</p>
                <p className="text-gray-600 dark:text-gray-300">
                  {[selected.shipping_info?.address, selected.shipping_info?.area]
                    .filter(Boolean)
                    .join(", ")},{" "}
                  {selected.shipping_info?.city},{" "}
                  {selected.shipping_info?.district} {selected.shipping_info?.pincode},{" "}
                  {selected.shipping_info?.country}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800/60">
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Subtotal</span>
                  <span>
                    {formatPrice(
                      toNumber(selected.total_price) -
                        toNumber(selected.shipping_price) +
                        toNumber(selected.discount || 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Shipping</span>
                  <span>{formatPrice(selected.shipping_price)}</span>
                </div>
                {toNumber(selected.discount || 0) > 0 ? (
                  <div className="flex justify-between py-1 text-accent-700">
                    <span className="font-medium">
                      Coupon ({selected.coupon_code})
                    </span>
                    <span>−{formatPrice(selected.discount)}</span>
                  </div>
                ) : null}
                <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-bold dark:border-gray-700">
                  <span>Total</span>
                  <span>{formatPrice(selected.total_price)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button onClick={() => setSelected(null)} className="btn-outline">
                <X size={15} /> Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
