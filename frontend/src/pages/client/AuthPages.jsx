import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Mail, RotateCcw } from "lucide-react";
import { forgotPassword, resetPassword } from "../../api/authApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";

export function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPassword(email, window.location.origin);
      toast.success(res.message);
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not send reset email"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <div className="card w-full max-w-md p-7">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Mail size={20} />
        </span>
        <h1 className="text-xl font-bold">Forgot your password?</h1>
        <p className="mt-2 text-sm text-gray-500">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
        {sent ? (
          <div className="mt-6 rounded-lg bg-brand-50 p-4 text-sm text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
            If an account exists for that email, a reset link has been sent. Check your inbox
            (and spam folder).
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              className="input"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
        <p className="mt-5 text-center text-sm text-gray-500">
          <Link to="/" className="font-semibold text-brand-700 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token, form.password, form.confirmPassword);
      toast.success(res.message);
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      toast.error(getErrorMessage(err, "Reset failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <div className="card w-full max-w-md p-7">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <RotateCcw size={20} />
        </span>
        <h1 className="text-xl font-bold">Reset your password</h1>
        <p className="mt-2 text-sm text-gray-500">Choose a new password for your account.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">New password</label>
            <input
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
            <label className="label">Confirm password</label>
            <input
              type="password"
              required
              className="input"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
