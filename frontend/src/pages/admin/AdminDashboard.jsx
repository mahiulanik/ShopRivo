import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Package,
  PackagePlus,
  TrendingUp,
  Users,
} from "lucide-react";
import { fetchDashboardStats } from "../../api/adminApi";
import { fetchAllOrders } from "../../api/orderApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import PageLoader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { formatPrice, truncate } from "../../utils/format";
import { ORDER_STATUSES, PLACEHOLDER_IMG } from "../../utils/constants";

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#8b5cf6", "#06b6d4"];

function BdtIcon({ size = 20 }) {
  return (
    <span className="font-bold leading-none" style={{ fontSize: size }}>
      ৳
    </span>
  );
}

function StatCard({ label, value, icon: Icon, accent, hint }) {
  return (
    <div className="admin-card relative overflow-hidden p-5">
      <span className={`absolute left-0 top-0 h-full w-1.5 ${accent}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1.5 text-2xl font-bold">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-admin-600/15 text-admin-600">
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { title } = useOutletContext();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [latestOrders, setLatestOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDashboardStats().catch((err) => {
        toast.error(getErrorMessage(err, "Failed to load dashboard stats"));
        return null;
      }),
      fetchAllOrders().catch(() => ({ orders: [] })),
    ])
      .then(([statsRes, ordersRes]) => {
        setStats(statsRes);
        setLatestOrders((ordersRes.orders || []).slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <PageLoader label="Loading dashboard..." />;

  const statusCounts = stats?.orderStatusCounts || {};
  const totalOrders = Object.entries(statusCounts).reduce(
    (sum, [status, value]) => (status === "Cancelled" ? sum : sum + Number(value || 0)),
    0
  );
  const donutData = ORDER_STATUSES.map((name) => ({
    name,
    value: Number(statusCounts[name] || 0),
  }));
  const monthlyData = (stats?.monthlySales || []).map((m) => ({
    ...m,
    shortMonth: m.month.split(" ")[0],
  }));

  const summaryCards = [
    { label: "Total Revenue", value: formatPrice(stats?.totalRevenueAllTime || 0), icon: BdtIcon, accent: "bg-emerald-500" },
    { label: "Today's Revenue", value: formatPrice(stats?.todayRevenue || 0), icon: BdtIcon, accent: "bg-sky-500" },
    { label: "Total Customers", value: stats?.totalUsersCount ?? 0, icon: Users, accent: "bg-amber-500" },
    { label: "Total Orders", value: totalOrders, icon: Package, accent: "bg-admin-500" },
  ];

  const quickActions = [
    { label: "Add Product", to: "/admin/product/add", classes: "bg-admin-600 hover:bg-admin-700" },
    { label: "All Products", to: "/admin/products", classes: "bg-blue-500 hover:bg-blue-600" },
    { label: "Orders", to: "/admin/orders", classes: "bg-amber-500 hover:bg-amber-600" },
    { label: "Customers", to: "/admin/customers", classes: "bg-cyan-500 hover:bg-cyan-600" },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: title }]} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className={`flex items-center justify-between rounded-xl px-5 py-4 text-sm font-semibold text-white transition ${action.classes}`}
          >
            {action.label}
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <div className="admin-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">Order Overview</h3>
            <Link to="/admin/orders" className="btn-admin px-3 py-1.5 text-xs">
              View All
            </Link>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="shortMonth" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip
                  formatter={(value) => [formatPrice(value), "Sales"]}
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
                <Bar dataKey="totalSales" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card p-5">
          <h3 className="mb-4 font-bold">Order Summary</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {donutData.map(({ name, value: count }, index) => (
              <div key={name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  {name}
                </span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <div className="admin-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">Latest Orders</h3>
            <Link to="/admin/orders" className="btn-admin px-3 py-1.5 text-xs">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="table-th">Product</th>
                  <th className="table-th">Items</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Amount</th>
                </tr>
              </thead>
              <tbody>
                {latestOrders.map((order) => {
                  const items = order.order_items || [];
                  const firstItem = items[0];

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
                            {items.length > 1 ? (
                              <span className="block text-xs text-gray-500">
                                +{items.length - 1} more
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </td>
                      <td className="table-td">{items.length}</td>
                      <td className="table-td">
                        <StatusBadge status={order.order_status} />
                      </td>
                      <td className="table-td font-semibold">{formatPrice(order.total_price)}</td>
                    </tr>
                  );
                })}
                {latestOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-td py-8 text-center text-gray-500">
                      No orders yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="admin-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">Revenue Growth</h3>
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-500">
                <TrendingUp size={15} /> {stats?.revenueGrowth || "0%"}
              </span>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <Area dataKey="totalSales" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500">This month</p>
                <p className="font-semibold">{formatPrice(stats?.currentMonthSales || 0)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500">New users</p>
                <p className="font-semibold">{stats?.newUsersThisMonth ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Low Stock</h3>
              <Link to="/admin/products" className="text-xs font-semibold text-admin-600">
                View All
              </Link>
            </div>
            <div className="space-y-2 text-sm">
              {(stats?.lowStockProducts || []).slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="truncate pr-2 text-gray-500">{truncate(p.name, 28)}</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                    {p.stock} left
                  </span>
                </div>
              ))}
              {!stats?.lowStockProducts?.length ? (
                <p className="text-gray-500">All products are well stocked.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">Top Selling Products</h3>
          <Link to="/admin/products" className="btn-admin px-3 py-1.5 text-xs">
            <PackagePlus size={13} /> Manage
          </Link>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="table-th">Product</th>
                <th className="table-th">Category</th>
                <th className="table-th">Ratings</th>
                <th className="table-th">Sold</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.topSellingProducts || []).map((p) => (
                <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800/60">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt=""
                        className="h-9 w-9 rounded-md bg-gray-100 object-contain p-0.5 dark:bg-gray-800"
                      />
                      <span className="font-medium">{truncate(p.name, 34)}</span>
                    </div>
                  </td>
                  <td className="table-td">{p.category}</td>
                  <td className="table-td">{Number(p.ratings || 0).toFixed(1)} ★</td>
                  <td className="table-td font-semibold">{p.total_sold}</td>
                </tr>
              ))}
              {!stats?.topSellingProducts?.length ? (
                <tr>
                  <td colSpan={4} className="table-td py-8 text-center text-gray-500">
                    No sales data yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
