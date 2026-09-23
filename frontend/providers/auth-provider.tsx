"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { api, apiGet, setAccessToken } from "@/lib/api";

export interface User {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    username: string;
    display_name?: string;
  }) => Promise<{ needsConfirmation: boolean }>;
  logout: () => Promise<void>;
  becomeCreator: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (session: Session | null) => {
    if (session) {
      setAccessToken(session.access_token);
      try {
        const profile = await apiGet<User>("/api/users/me");
        setUser(profile);
      } catch {
        setUser(null);
      }
    } else {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session).finally(() => setLoading(false));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      applySession(session);
      if (event === "SIGNED_IN") {
        import("@/lib/api").then(({ api }) => api("/api/users/me/login-event", { method: "POST" }).catch(() => {}));
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [applySession]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      username: string;
      display_name?: string;
    }) => {
      const { data: res, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            display_name: data.display_name || data.username,
          },
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw new Error(error.message);
      return { needsConfirmation: !res.session };
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await applySession(data.session);
  }, [applySession]);

  const becomeCreator = useCallback(async () => {
    const updated = await api<User>("/api/users/me/become-creator", {
      method: "POST",
    });
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, becomeCreator, refreshUser }}
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
