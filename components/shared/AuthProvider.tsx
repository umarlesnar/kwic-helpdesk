//components/shared/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SessionUser } from "@/lib/auth";

interface AuthContextType {
  user: SessionUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved auth state from localStorage
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");

    console.log("Loading auth state from localStorage");
    console.log("Saved token exists:", !!savedToken);
    console.log("Saved user exists:", !!savedUser);

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        console.log(
          "Auth state loaded successfully for user:",
          parsedUser.email
        );
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login for email:", email);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("Login response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Login successful, received data:", {
          user: data.user,
          hasToken: !!data.token,
        });

        setUser(data.user);
        setToken(data.token);

        // Save to localStorage
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));

        console.log("Auth state saved to localStorage");

        return true;
      } else {
        const errorData = await response.json();
        console.error("Login failed:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    console.log("Logging out user");
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    console.log("Auth state cleared");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
