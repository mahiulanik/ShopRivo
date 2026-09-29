import axios from "axios";

// Empty in dev -> requests go to the same origin (/api/...) and Vite's dev
// proxy forwards them to the backend. This bypasses CORS entirely, so the app
// works on any port (5173, 5174, LAN IP, 127.0.0.1...).
// Set VITE_API_URL only for deployments where the API is on another origin.
const BASE_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
export const API_BASE_URL = BASE_URL;
const ACCESS_TOKEN_KEY = "shopcart_access_token";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const setAccessToken = (token) => {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
};

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

const tryRefreshToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/api/auth/refresh-token`, {}, { withCredentials: true })
      .then((res) => {
        const token = res?.data?.accessToken;
        if (token) setAccessToken(token);
        return token;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;
    const url = original?.url || "";

    const isAuthRoute =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/refresh-token");

    if (status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      const token = await tryRefreshToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  // No response at all -> server unreachable, CORS blocked or request aborted.
  if (!error?.response) {
    if (error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "")) {
      return "Request timed out. Please try again.";
    }
    return "Cannot reach the server. Make sure the backend is running on http://localhost:4000.";
  }
  return (
    error.response.data?.message || error.response.data?.error || fallback
  );
};

export default api;
