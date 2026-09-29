import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Clapperboard,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  PanelLeft,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Sun,
  Tags,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Avatar from "../common/Avatar";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true, adminOnly: true },
  { to: "/admin/category", label: "Category", icon: FolderTree },
  {
    label: "Products",
    icon: Package,
    children: [
      { to: "/admin/product/add", label: "Add Product" },
      { to: "/admin/products", label: "All Products", end: true },
    ],
  },
  {
    label: "Coupons",
    icon: Ticket,
    adminOnly: true,
    children: [
      { to: "/admin/coupon/add", label: "Add Coupon" },
      { to: "/admin/coupons", label: "All Coupons", end: true },
    ],
  },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart, adminOnly: true },
  { to: "/admin/customers", label: "Customers", icon: Users, adminOnly: true },
  { to: "/admin/admins", label: "Admins", icon: ShieldCheck, adminOnly: true },
  { to: "/admin/reviews", label: "Rating & Review", icon: Star, adminOnly: true },
  { to: "/admin/media", label: "Media", icon: Clapperboard },
];

const pageTitles = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/product/add": "New Product",
  "/admin/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/admins": "Admins",
  "/admin/category": "Category",
  "/admin/coupons": "Coupons",
  "/admin/coupon/add": "New Coupon",
  "/admin/reviews": "Reviews",
  "/admin/media": "Media",
};

function SidebarContent({ onNavigate }) {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const items = nav.filter((item) => !item.adminOnly || isAdmin);
  const [open, setOpen] = useState(() => {
    const match = items.find((item) =>
      item.children?.some((child) => location.pathname.startsWith(child.to.replace(/\/add$/, "")))
    );
    return match ? match.label : null;
  });

  return (
    <div className="flex h-full flex-col">
      <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-admin-600 text-white">
          <ShoppingBag size={18} />
        </span>
        <span className="text-xl font-bold">E-store</span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6 scrollbar-thin">
        {items.map((item) => {
          if (item.children) {
            const isOpen = open === item.label;
            const active = item.children.some((child) =>
              child.end
                ? location.pathname === child.to
                : location.pathname.startsWith(child.to.replace(/\/add$/, ""))
            );
            return (
              <div key={item.label}>
                <button
                  onClick={() => setOpen(isOpen ? null : item.label)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-admin-600/15 text-admin-600"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon size={17} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                {isOpen ? (
                  <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-700">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end={child.end}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          `block rounded-md px-3 py-2 text-sm transition ${
                            isActive
                              ? "font-semibold text-admin-600"
                              : "text-gray-500 hover:text-admin-600 dark:text-gray-400"
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-admin-600/15 text-admin-600"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("admin_theme") !== "light");
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("admin_theme", dark ? "dark" : "light");
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const onLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const onSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Uploader only has Products / Category / Media
    if (!isAdmin) navigate("/admin/products");
    else if (/order/i.test(query)) navigate("/admin/orders");
    else if (/product/i.test(query)) navigate("/admin/products");
    else if (/customer|user/i.test(query)) navigate("/admin/customers");
    else navigate("/admin/products");
    setQuery("");
  };

  const title =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/admin/orders/") ? "Order Status" : "Admin");

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-gray-200 bg-white lg:block dark:border-gray-800 dark:bg-gray-900">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-gray-900">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded p-1 text-gray-500"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
            aria-label="Open menu"
          >
            <Menu size={19} />
          </button>

          <form onSubmit={onSearch} className="hidden max-w-md flex-1 sm:block">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="admin-input pr-10"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label="Search"
              >
                <Search size={16} />
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setDark((v) => !v)}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              to="/"
              className="hidden rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 sm:block dark:hover:bg-gray-800"
              title="View storefront"
            >
              <PanelLeft size={18} />
            </Link>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 py-1 pl-1 pr-3 dark:border-gray-700">
              <Avatar
                src={user?.avatar?.url}
                name={user?.name}
                className="h-7 w-7"
                shape="rounded-md"
                fallbackClassName="bg-admin-600 text-xs text-white"
                fallbackLetter="A"
              />
              <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
              aria-label="Logout"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6">
          <Outlet context={{ title }} />
        </main>

        <footer className="border-t border-gray-200 py-5 text-center text-xs text-gray-500 dark:border-gray-800">
          © {new Date().getFullYear()} E-store. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}
