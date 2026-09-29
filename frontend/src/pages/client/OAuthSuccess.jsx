import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PageLoader from "../../components/common/Loader";
import { setAccessToken } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function OAuthSuccess() {
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = params.get("token");
    if (!token) {
      setError("Google sign-in failed. No token was returned.");
      return;
    }

    (async () => {
      setAccessToken(token);
      const user = await refreshUser();
      if (!user) {
        setError("Google sign-in failed. Your session could not be verified.");
        return;
      }
      navigate(
        user.role === "Admin" || user.role === "Uploader" ? "/admin" : "/",
        { replace: true }
      );
    })();
  }, [params, refreshUser, navigate]);

  if (error) {
    return (
      <div className="container-x flex flex-col items-center justify-center gap-3 py-24 text-center">
        <h1 className="text-xl font-bold">Sign in unsuccessful</h1>
        <p className="text-sm text-gray-500">{error}</p>
        <Link to="/" className="btn-primary mt-2">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <PageLoader label="Signing you in..." />
    </div>
  );
}
