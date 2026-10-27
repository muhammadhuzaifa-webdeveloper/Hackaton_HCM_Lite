"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { authApi, User } from "@/api/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (data: { currentPassword?: string; newPassword: string }) => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    let token = null;
    if (typeof window !== "undefined") {
      token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");
      if (!token) {
        const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
        if (match) token = match[1];
      }
    }

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await authApi.me();
      setUser(data.user);
    } catch (err: any) {
      if (err.response?.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          document.cookie = "accessToken=; path=/; max-age=0";
        }
        setUser(null);
      } else {
        console.warn("Auth fetch failed:", err?.message || err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login(email, password);
    if (res.accessToken && typeof window !== "undefined") {
      localStorage.setItem("accessToken", res.accessToken);
      sessionStorage.setItem("accessToken", res.accessToken);
      document.cookie = `accessToken=${res.accessToken}; path=/; max-age=86400; SameSite=Lax`;
    }
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        document.cookie = "accessToken=; path=/; max-age=0";
      }
      setUser(null);
    }
  };

  const changePassword = async (data: { currentPassword?: string; newPassword: string }) => {
    await authApi.changePassword(data);
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: fetchCurrentUser,
        changePassword,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
