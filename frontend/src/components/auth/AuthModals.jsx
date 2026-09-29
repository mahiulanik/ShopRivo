import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API_BASE_URL, getErrorMessage } from "../../api/client";
import Modal from "../common/Modal";

function GoogleGIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function GoogleAuthSection() {
  const [loading, setLoading] = useState(false);

  const continueWithGoogle = () => {
    if (loading) return;
    setLoading(true);
    // Full page redirect: backend sends us to Google, then back to /oauth-success
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={loading}
        className="btn-outline w-full"
      >
        <GoogleGIcon />
        {loading ? "Redirecting..." : "Continue with Google"}
      </button>
      <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        or
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export function LoginModal({ open, onClose, onSwitch, onForgot }) {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success("Logged in successfully");
      onClose();
      const from = location.state?.from;
      if (from) navigate(from, { replace: true });
      else if (user?.role === "Admin" || user?.role === "Uploader") navigate("/admin");
    } catch (err) {
      toast.error(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Sign in to ShopCart" width="max-w-md">
      <p className="-mt-2 mb-5 text-sm text-gray-500">Welcome back! Please sign in to continue</p>
      <GoogleAuthSection />
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            required
            className="input"
            placeholder="Enter your email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label mb-0" htmlFor="login-password">
              Password
            </label>
            <button
              type="button"
              onClick={onForgot}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="login-password"
            type="password"
            required
            className="input mt-1.5"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-dark w-full">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <button onClick={onSwitch} className="font-semibold text-brand-700 hover:underline">
          Sign up
        </button>
      </p>
    </Modal>
  );
}

export function RegisterModal({ open, onClose, onSwitch }) {
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      toast.success("Account created! Please sign in.");
      onSwitch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create your account" width="max-w-md">
      <p className="-mt-2 mb-5 text-sm text-gray-500">
        Welcome! Please fill in the details to get started.
      </p>
      <GoogleAuthSection />
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="reg-name">
            Full name
          </label>
          <input
            id="reg-name"
            type="text"
            required
            minLength={3}
            className="input"
            placeholder="Enter your full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="reg-email">
            Email address
          </label>
          <input
            id="reg-email"
            type="email"
            required
            className="input"
            placeholder="Enter your email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="reg-password">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            required
            minLength={8}
            maxLength={16}
            className="input"
            placeholder="8-16 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="reg-confirm">
            Confirm password
          </label>
          <input
            id="reg-confirm"
            type="password"
            required
            className="input"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-dark w-full">
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button onClick={onSwitch} className="font-semibold text-brand-700 hover:underline">
          Sign in
        </button>
      </p>
    </Modal>
  );
}
