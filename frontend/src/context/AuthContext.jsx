import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/authApi";
import { getAccessToken, setAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return null;
    }
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      return data.user;
    } catch (err) {
      const status = err?.response?.status;
      // Only discard the token when the server actually rejected it.
      // Network errors / outages must not log the user out.
      if (status === 401 || status === 403) {
        setAccessToken(null);
        setUser(null);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadUser();
      setInitializing(false);
    })();
  }, [loadUser]);

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials);
      setAccessToken(data.accessToken);
      const me = await loadUser();
      if (!me) {
        // Login response arrived but the profile could not be verified.
        setAccessToken(null);
        throw new Error(
          "Could not verify your account. Make sure the backend is running on http://localhost:4000."
        );
      }
      return me;
    },
    [loadUser]
  );

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(() => loadUser(), [loadUser]);

  const role = user?.role;

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAdmin: role === "Admin",
      isUploader: role === "Uploader",
      canAccessAdmin: role === "Admin" || role === "Uploader",
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      setUser,
      refreshUser,
    }),
    [user, role, initializing, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
