import { useEffect, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { Eye, Search } from "lucide-react";
import { fetchAllOrders } from "../../api/orderApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import PageLoader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { ORDER_STATUSES, PLACEHOLDER_IMG } from "../../utils/constants";
import { formatDate, formatPrice, truncate } from "../../utils/format";

const filterSelectClass =
  "w-full max-w-[150px] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 outline-none transition focus:border-admin-500 focus:ring-1 focus:ring-admin-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

const itemOptions = [
  { value: "", label: "Any items" },
  { value: "1", label: "1 item" },
  { value: "2", label: "2 items" },
  { value: "3", label: "3 items" },
  { value: "4+", label: "4+ items" },
];

const paymentOptions = [
  { value: "", label: "Any payment" },
  { value: "Online", label: "Online" },
  { value: "Cash on Delivery", label: "Cash on Delivery" },
  { value: "Paid", label: "Paid" },
  { value: "Pending", label: "Pending" },
  { value: "Failed", label: "Failed" },
  { value: "Canceled", label: "Canceled" },
  { value: "Refunded", label: "Refunded" },
];

const dateOptions = [
  { value: "", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

const amountOptions = [
  { value: "", label: "Any amount" },
  { value: "0-1000", label: "৳0 – 1,000" },
  { value: "1000-5000", label: "৳1,000 – 5,000" },
  { value: "5000-25000", label: "৳5,000 – 25,000" },
  { value: "25000-100000", label: "৳25,000 – 1,00,000" },
  { value: "100000-", label: "৳1,00,000 +" },
];

const FILTER_KEYS = ["items", "payment", "date", "status", "amount"];

export default function AdminOrders() {
  const { title } = useOutletContext();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const search = (searchParams.get("search") || "").toLowerCase();
  const items = searchParams.get("items") || "";
  const payment = searchParams.get("payment") || "";
  const date = searchParams.get("date") || "";
  const status = searchParams.get("status") || "";
  const amount = searchParams.get("amount") || "";
  const hasFilters = FILTER_KEYS.some((key) => searchParams.get(key));

  useEffect(() => {
    fetchAllOrders()
      .then((res) => setOrders(res.orders || []))
      .catch((err) => toast.error(getErrorMessage(err, "Failed to load orders")))
      .finally(() => setLoading(false));
  }, [toast]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    FILTER_KEYS.forEach((key) => next.delete(key));
    setSearchParams(next);
  };

  const applySearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (query.trim()) next.set("search", query.trim());
    else next.delete("search");
    setSearchParams(next);
  };

  const matchesItems = (order) => {
    if (!items) return true;
    const count = order.order_items?.length || 0;
    return items === "4+" ? count >= 4 : count === Number(items);
  };

  const matchesPayment = (order) => {
    if (!payment) return true;
    const type = order.payment?.payment_type || "";
    const paymentStatus = order.payment?.payment_status || "";
    if (payment === "Online" || payment === "Cash on Delivery") return type === payment;
    return paymentStatus === payment;
  };

  const matchesDate = (order) => {
    if (!date) return true;
    const orderedAt = new Date(order.created_at);
    if (Number.isNaN(orderedAt.getTime())) return false;
    const now = new Date();
    if (date === "today") {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return orderedAt >= startOfToday;
    }
    const days = Number(date);
    return orderedAt >= new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  };

  const matchesStatus = (order) => !status || order.order_status === status;

  const matchesAmount = (order) => {
    if (!amount) return true;
    const [minRaw, maxRaw] = amount.split("-");
    const min = Number(minRaw);
    const max = maxRaw === "" ? Infinity : Number(maxRaw);
    const value = Number(order.total_price || 0);
    return value >= min && value <= max;
  };

  const filtered = orders.filter(
    (order) =>
      (!search ||
        order.id.toLowerCase().includes(search) ||
        (order.order_status || "").toLowerCase().includes(search) ||
        (order.shipping_info?.contact_name || "").toLowerCase().includes(search) ||
        (order.payment?.payment_type || "").toLowerCase().includes(search)) &&
      matchesItems(order) &&
      matchesPayment(order) &&
      matchesDate(order) &&
      matchesStatus(order) &&
      matchesAmount(order)
  );

  return (
    <div>
      <Breadcrumbs items={[{ label: title }]} />

      <div className="admin-card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold uppercase">Orders</h2>
          <p className="text-sm text-gray-500">{orders.length} total orders</p>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={applySearch} className="relative">
            <input
              className="admin-input w-64 pl-9"
              placeholder="Search by id, status, customer..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search size={15} className="absolute left-3 top-3 text-gray-400" />
          </form>
          <div className="flex items-center gap-3">
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-admin-600 hover:underline"
              >
                Clear filters
              </button>
            ) : null}
            <p className="text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? "order" : "orders"}
            </p>
          </div>
        </div>

        {loading ? (
          <PageLoader label="Loading orders..." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="table-th">Product</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">
                    <div className="space-y-1.5">
                      <span className="block">Items</span>
                      <select
                        aria-label="Filter by items"
                        className={filterSelectClass}
                        value={items}
                        onChange={(e) => setFilter("items", e.target.value)}
                      >
                        {itemOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th className="table-th">
                    <div className="space-y-1.5">
                      <span className="block">Payment</span>
                      <select
                        aria-label="Filter by payment"
                        className={filterSelectClass}
                        value={payment}
                        onChange={(e) => setFilter("payment", e.target.value)}
                      >
                        {paymentOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th className="table-th">
                    <div className="space-y-1.5">
                      <span className="block">Date</span>
                      <select
                        aria-label="Filter by date"
                        className={filterSelectClass}
                        value={date}
                        onChange={(e) => setFilter("date", e.target.value)}
                      >
                        {dateOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th className="table-th">
                    <div className="space-y-1.5">
                      <span className="block">Status</span>
                      <select
                        aria-label="Filter by status"
                        className={filterSelectClass}
                        value={status}
                        onChange={(e) => setFilter("status", e.target.value)}
                      >
                        <option value="">All statuses</option>
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th className="table-th text-right">
                    <div className="space-y-1.5">
                      <span className="block">Amount</span>
                      <select
                        aria-label="Filter by amount"
                        className={`${filterSelectClass} ml-auto`}
                        value={amount}
                        onChange={(e) => setFilter("amount", e.target.value)}
                      >
                        {amountOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const orderItems = order.order_items || [];
                  const firstItem = orderItems[0];

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 transition hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/40"
                    >
                      <td className="table-td">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="flex items-center gap-3 hover:text-admin-600"
                        >
                          <img
                            src={firstItem?.image || PLACEHOLDER_IMG}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-md bg-gray-100 object-contain p-0.5 dark:bg-gray-800"
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {truncate(firstItem?.title || "Order", 30)}
                            </span>
                            {orderItems.length > 1 ? (
                              <span className="block text-xs text-gray-500">
                                +{orderItems.length - 1} more
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </td>
                      <td className="table-td">{order.shipping_info?.contact_name || order.buyer_id?.slice(0, 8) || "--"}</td>
                      <td className="table-td">{orderItems.length}</td>
                      <td className="table-td">
                        <div className="text-xs">
                          <p>{order.payment?.payment_type || "—"}</p>
                          <p className="text-gray-400">{order.payment?.payment_status || ""}</p>
                        </div>
                      </td>
                      <td className="table-td">{formatDate(order.created_at)}</td>
                      <td className="table-td">
                        <StatusBadge status={order.order_status} />
                      </td>
                      <td className="table-td text-right font-semibold">
                        {formatPrice(order.total_price)}
                      </td>
                      <td className="table-td text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="inline-flex rounded-md border border-gray-200 p-1.5 text-gray-500 transition hover:border-admin-500 hover:text-admin-600 dark:border-gray-700"
                          title="View order"
                        >
                          <Eye size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-td py-10 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
