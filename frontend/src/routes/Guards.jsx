import { Navigate, useLocation } from "react-router-dom";
import PageLoader from "../components/common/Loader";
import { useAuth } from "../context/AuthContext";

export function RequireAuth({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader label="Checking your session..." />;
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname, openLogin: true }} />;
  }
  return children;
}

export function RequireAdmin({ children }) {
  const { canAccessAdmin, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader label="Checking your session..." />;
  if (!canAccessAdmin) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return children;
}

// Admin-only pages: Uploader is redirected to their own section.
export function AdminOnly({ children }) {
  const { isAdmin, initializing } = useAuth();

  if (initializing) return <PageLoader label="Checking your session..." />;
  if (!isAdmin) {
    return <Navigate to="/admin/products" replace />;
  }
  return children;
}
