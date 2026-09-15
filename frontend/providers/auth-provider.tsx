"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  API_URL,
  api,
  setAccessToken,
  setUnauthorizedHandler,
} from "@/lib/api";

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: string;
  email_verified: boolean;
  avatar_url: string | null;
}

interface AuthResult {
  access_token: string;
  user: User;
  verification_token?: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    display_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Silent refresh — used on mount and whenever an access token expires.
  const refresh = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data: AuthResult = await res.json();
      setAccessToken(data.access_token);
      setUser(data.user);
      return data.access_token;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(refresh);
    refresh().finally(() => setLoading(false));
    return () => setUnauthorizedHandler(null);
  }, [refresh]);

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await api<AuthResult>("/api/auth/login", {
      method: "POST",
      json: { identifier, password },
    });
    setAccessToken(data.access_token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (payload: {
      email: string;
      username: string;
      password: string;
      display_name?: string;
    }) => {
      const data = await api<AuthResult>("/api/auth/register", {
        method: "POST",
        json: payload,
      });
      setAccessToken(data.access_token);
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser: async () => {
          await refresh();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
