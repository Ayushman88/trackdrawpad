"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface SessionContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  validateToken: () => Promise<boolean>;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Helper functions for cookie management
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === "undefined") return; // SSR check

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null; // SSR check

  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return; // SSR check

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const validateToken = async (): Promise<boolean> => {
    try {
      const token = getCookie("token");

      if (!token) {
        return false;
      }

      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        return true;
      } else {
        // Token is invalid, clear cookies
        deleteCookie("token");
        deleteCookie("user");
        localStorage.removeItem("boardType");
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  };

  const login = async (token: string, userData: User): Promise<void> => {
    try {
      // Store token and user data in cookies
      setCookie("token", token, 7); // 7 days expiry
      setCookie("user", JSON.stringify(userData), 7);

      // Set user immediately for instant authentication
      setUser(userData);

      // Validate token in background
      await validateToken();
    } catch (error) {
      console.error("Login error:", error);
      // If validation fails, clear everything
      deleteCookie("token");
      deleteCookie("user");
      localStorage.removeItem("boardType");
      setUser(null);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout API
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear cookies and localStorage regardless of API call success
      deleteCookie("token");
      deleteCookie("user");
      localStorage.removeItem("boardType");
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await validateToken();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const value: SessionContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    validateToken,
    login,
    logout,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
