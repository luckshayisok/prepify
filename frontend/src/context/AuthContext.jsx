import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, onSessionExpired, tokens } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokens.access || tokens.refresh));

  const refreshUser = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    if (!tokens.access && !tokens.refresh) return;
    refreshUser()
      .catch(() => {
        tokens.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        queryClient.clear();
      }),
    [queryClient]
  );

  const authenticate = useCallback(async (path, body) => {
    const { data } = await api.post(path, body);
    tokens.set(data);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    tokens.clear();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      refreshUser,
      login: (email, password) => authenticate("/auth/login", { email, password }),
      signup: (name, email, password) => authenticate("/auth/signup", { name, email, password }),
      logout,
    }),
    [user, loading, refreshUser, authenticate, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
