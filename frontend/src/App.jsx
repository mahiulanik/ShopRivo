import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminLayout from "./components/admin/AdminLayout";
import Footer from "./components/client/Footer";
import Navbar from "./components/client/Navbar";
import PageLoader from "./components/common/Loader";
import { useAuth } from "./context/AuthContext";
import { AdminOnly, RequireAdmin, RequireAuth } from "./routes/Guards";
import HomePage from "./pages/client/HomePage";

// Route-level code splitting: only the active route's chunk is downloaded.
const ShopPage = lazy(() => import("./pages/client/ShopPage"));
const ProductPage = lazy(() => import("./pages/client/ProductPage"));
const AboutPage = lazy(() => import("./pages/client/AboutPage"));
const ContactPage = lazy(() => import("./pages/client/ContactPage"));
const ForgotPasswordPage = lazy(() =>
  import("./pages/client/AuthPages").then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import("./pages/client/AuthPages").then((m) => ({ default: m.ResetPasswordPage }))
);
const OAuthSuccess = lazy(() => import("./pages/client/OAuthSuccess"));
const CartPage = lazy(() => import("./pages/client/CartPage"));
const CheckoutPage = lazy(() => import("./pages/client/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/client/OrderSuccessPage"));
const OrdersPage = lazy(() => import("./pages/client/OrdersPage"));
const WishlistPage = lazy(() => import("./pages/client/WishlistPage"));
const AccountPage = lazy(() => import("./pages/client/AccountPage"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductForm = lazy(() => import("./pages/admin/AdminProductForm"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/AdminOrderDetail"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const Admins = lazy(() => import("./pages/admin/Admins"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminCoupons = lazy(() =>
  import("./pages/admin/AdminCoupons").then((m) => ({ default: m.AdminCoupons }))
);
const AdminCouponForm = lazy(() =>
  import("./pages/admin/AdminCoupons").then((m) => ({ default: m.AdminCouponForm }))
);
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ClientLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader label="Loading page..." />}>{children}</Suspense>
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <ClientLayout>
      <div className="container-x flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-6xl font-extrabold text-brand-700">404</p>
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="text-sm text-gray-500">The page you are looking for doesn&apos;t exist.</p>
        <a href="/" className="btn-primary mt-2">
          Back to home
        </a>
      </div>
    </ClientLayout>
  );
}

export default function App() {
  const { initializing } = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoader label="Preparing your store..." />
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminOnly><AdminDashboard /></AdminOnly>} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="product/add" element={<AdminProductForm />} />
          <Route path="product/:productId/edit" element={<AdminProductForm />} />
          <Route path="orders" element={<AdminOnly><AdminOrders /></AdminOnly>} />
          <Route path="orders/:orderId" element={<AdminOnly><AdminOrderDetail /></AdminOnly>} />
          <Route path="customers" element={<AdminOnly><AdminCustomers /></AdminOnly>} />
          <Route path="admins" element={<AdminOnly><Admins /></AdminOnly>} />
          <Route path="category" element={<AdminCategories />} />
          <Route path="coupons" element={<AdminOnly><AdminCoupons /></AdminOnly>} />
          <Route path="coupon/add" element={<AdminOnly><AdminCouponForm /></AdminOnly>} />
          <Route path="reviews" element={<AdminOnly><AdminReviews /></AdminOnly>} />
          <Route path="media" element={<AdminMedia />} />
        </Route>

        {/* Client */}
        <Route
          path="/"
          element={
            <ClientLayout>
              <HomePage />
            </ClientLayout>
          }
        />
        <Route
          path="/shop"
          element={
            <ClientLayout>
              <ShopPage />
            </ClientLayout>
          }
        />
        <Route
          path="/product/:productId"
          element={
            <ClientLayout>
              <ProductPage />
            </ClientLayout>
          }
        />
        <Route
          path="/about"
          element={
            <ClientLayout>
              <AboutPage />
            </ClientLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <ClientLayout>
              <ContactPage />
            </ClientLayout>
          }
        />
        <Route
          path="/password/forgot"
          element={
            <ClientLayout>
              <ForgotPasswordPage />
            </ClientLayout>
          }
        />
        <Route
          path="/password/reset/:token"
          element={
            <ClientLayout>
              <ResetPasswordPage />
            </ClientLayout>
          }
        />
        <Route
          path="/oauth-success"
          element={
            <ClientLayout>
              <OAuthSuccess />
            </ClientLayout>
          }
        />
        <Route
          path="/cart"
          element={
            <ClientLayout>
              <CartPage />
            </ClientLayout>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <ClientLayout>
                <CheckoutPage />
              </ClientLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/order-success/:orderId"
          element={
            <RequireAuth>
              <ClientLayout>
                <OrderSuccessPage />
              </ClientLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <ClientLayout>
                <OrdersPage />
              </ClientLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ClientLayout>
              <WishlistPage />
            </ClientLayout>
          }
        />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <ClientLayout>
                <AccountPage />
              </ClientLayout>
            </RequireAuth>
          }
        />

        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
