"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { invalidateUserData } from "@/lib/data-cache";

export type UserRole = "user" | "admin";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role?: UserRole;
  username?: string | null;
  phone?: string | null;
  emailReminders?: boolean;
  smsReminders?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isHydrated: boolean;
  login: (identifier: string, password: string, name?: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    name: string;
    profile?: Record<string, unknown>;
    vehicles?: unknown[];
    destinationAddress?: string;
    destinationLat?: number;
    destinationLon?: number;
    isAddressConfirmed?: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: AuthUser };
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshUser().finally(() => setIsHydrated(true));
  }, [refreshUser]);

  const login = useCallback(async (identifier: string, password: string, name?: string) => {
    const trimmed = identifier.trim();
    if (!trimmed || !password) throw new Error("Email and password required");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ identifier: trimmed, password, name: name?.trim() }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Login failed");
    }

    invalidateUserData();
    const meRes = await fetch("/api/auth/me", { credentials: "include" });
    if (!meRes.ok) {
      throw new Error("Session could not be established. Try again or contact support.");
    }
    const data = (await meRes.json()) as { user: AuthUser };
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      name: string;
      profile?: Record<string, unknown>;
      vehicles?: unknown[];
      destinationAddress?: string;
      destinationLat?: number;
      destinationLon?: number;
      isAddressConfirmed?: boolean;
    }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Registration failed");
      }

      invalidateUserData();
      await refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    invalidateUserData();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isHydrated,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isHydrated, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
