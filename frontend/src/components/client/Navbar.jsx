import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { fetchCategories } from "../../api/productApi";
import { LoginModal, RegisterModal } from "../auth/AuthModals";
import Avatar from "../common/Avatar";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
];

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isUploader, logout } = useAuth();
  const { count } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null
  const [profileOpen, setProfileOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const profileRef = useRef(null);

  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (window.history.state?.usr?.openLogin) setAuthModal("login");
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    setMobileOpen(false);
  };

  const onLogout = async () => {
    await logout();
    setProfileOpen(false);
    toast.success("Logged out successfully");
    navigate("/");
  };

  const menuItem =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="container-x relative flex h-[70px] items-center gap-3">
          <Link to="/" className="shrink-0 text-2xl font-extrabold tracking-tight">
            <span className="text-gray-900">SHOP</span>
            <span className="text-brand-700">CART</span>
          </Link>

          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `text-sm font-medium transition hover:text-brand-700 ${
                    isActive ? "text-brand-700" : "text-gray-700"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* Categories dropdown (opens on hover) */}
            <div className="group relative">
              <span className="flex cursor-pointer items-center gap-1 text-sm font-medium text-gray-700 transition hover:text-brand-700 group-hover:text-brand-700 dark:text-gray-200 dark:group-hover:text-brand-700">
                Categories
                <ChevronDown
                  size={14}
                  className="transition-transform duration-200 group-hover:rotate-180"
                />
              </span>
              <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-100 bg-white py-2 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                  {categories.length === 0 ? (
                    <span className="block px-4 py-2 text-sm text-gray-400">
                      No categories yet
                    </span>
                  ) : (
                    categories.map((cat) => (
                      <Link
                        key={cat.id || cat.name}
                        to={`/shop?category=${encodeURIComponent(cat.name)}`}
                        className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 hover:text-brand-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-brand-700"
                      >
                        {cat.name}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            <form
              onSubmit={submitSearch}
              className="hidden items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 dark:bg-gray-800 md:flex"
            >
              <Search size={17} className="shrink-0 text-gray-500" />
              <input
                className="w-36 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500 dark:text-gray-100 lg:w-56 xl:w-64"
                placeholder="Search products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>

            <Link
              to="/cart"
              className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              aria-label="Cart"
            >
              <span className="relative">
                <ShoppingBag size={20} />
                {count > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-400 px-1 text-[10px] font-bold text-gray-900">
                    {count}
                  </span>
                ) : null}
              </span>
              <span className="hidden text-sm font-medium sm:inline">Cart</span>
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center rounded-full p-0.5 ring-1 ring-gray-200 transition hover:ring-gray-300 dark:ring-gray-700"
                  aria-label="Account menu"
                  aria-expanded={profileOpen}
                >
                  <Avatar
                    src={user?.avatar?.url}
                    name={user?.name}
                    className="h-9 w-9"
                    fallbackClassName="bg-brand-700 text-sm text-white"
                  />
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-3 px-4 py-4">
                      <Avatar
                        src={user?.avatar?.url}
                        name={user?.name}
                        className="h-10 w-10"
                        fallbackClassName="bg-brand-700 text-sm text-white"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                          {user?.name}
                        </p>
                        <p className="truncate text-[13px] text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <Link
                        to="/account"
                        onClick={() => setProfileOpen(false)}
                        className={menuItem}
                      >
                        <Settings size={18} className="text-gray-500" />
                        Manage account
                      </Link>
                      <Link to="/orders" onClick={() => setProfileOpen(false)} className={menuItem}>
                        <Package size={18} className="text-gray-500" />
                        My Orders
                      </Link>
                      <Link to="/wishlist" onClick={() => setProfileOpen(false)} className={menuItem}>
                        <Heart size={18} className="text-gray-500" />
                        My Wishlist
                      </Link>
                      {isAdmin || isUploader ? (
                        <Link to="/admin" onClick={() => setProfileOpen(false)} className={menuItem}>
                          <ShieldCheck size={18} className="text-gray-500" />
                          Admin panel
                        </Link>
                      ) : null}
                      <button onClick={onLogout} className={menuItem}>
                        <LogOut size={18} className="text-gray-500" />
                        Sign out
                      </button>

                      <div className="my-1.5 border-t border-gray-100 dark:border-gray-800" />

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setAuthModal("login");
                        }}
                        className={menuItem}
                      >
                        <PlusCircle size={18} className="text-gray-500" />
                        Add account
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                onClick={() => setAuthModal("login")}
                className="ml-1 hidden rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 sm:block dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Login
              </button>
            )}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-full p-2 text-gray-600 lg:hidden dark:text-gray-300"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-gray-100 bg-white px-4 py-4 lg:hidden dark:bg-gray-950">
            <form onSubmit={submitSearch} className="mb-3 flex gap-2">
              <input
                className="input"
                placeholder="Search products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn-primary px-3">
                <Search size={16} />
              </button>
            </form>
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {link.label}
                </NavLink>
              ))}
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Categories
              </p>
              {categories.length === 0 ? (
                <span className="px-3 py-1 text-sm text-gray-400">No categories yet</span>
              ) : (
                categories.map((cat) => (
                  <NavLink
                    key={cat.id || cat.name}
                    to={`/shop?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {cat.name}
                  </NavLink>
                ))
              )}
              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/orders"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    My Orders
                  </NavLink>
                  <NavLink
                    to="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    My Wishlist
                  </NavLink>
                  <NavLink
                    to="/account"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Manage account
                  </NavLink>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthModal("login");
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Login / Register
                </button>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <LoginModal
        open={authModal === "login"}
        onClose={() => setAuthModal(null)}
        onSwitch={() => setAuthModal("register")}
        onForgot={() => {
          setAuthModal(null);
          navigate("/password/forgot");
        }}
      />
      <RegisterModal
        open={authModal === "register"}
        onClose={() => setAuthModal(null)}
        onSwitch={() => setAuthModal("login")}
      />
    </>
  );
}
