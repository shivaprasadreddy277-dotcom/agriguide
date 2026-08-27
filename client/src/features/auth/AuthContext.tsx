import React, { createContext, useContext, useState, useEffect } from "react";
import { api, ApiError } from "../../lib/apiClient.js";
import { registerSchema, loginSchema } from "shared";
import { z } from "zod";

export interface User {
  id: string;
  fullName: string;
  email: string;
  preferredLanguage: "en" | "hi";
  unitSystem: "metric" | "imperial";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: z.infer<typeof loginSchema>) => Promise<void>;
  register: (data: z.infer<typeof registerSchema>) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { fullName: string; preferredLanguage: "en" | "hi"; unitSystem: "metric" | "imperial" }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check session on load
    async function checkSession() {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (err) {
        // Ignored, user is just unauthenticated
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = async (data: z.infer<typeof loginSchema>) => {
    setError(null);
    try {
      const loggedUser = await api.auth.login(data);
      setUser(loggedUser);
    } catch (err: any) {
      setError(err.message || "Login failed.");
      throw err;
    }
  };

  const register = async (data: z.infer<typeof registerSchema>) => {
    setError(null);
    try {
      const newUser = await api.auth.register(data);
      setUser(newUser);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await api.auth.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message || "Logout failed.");
      throw err;
    }
  };

  const updateProfile = async (data: { fullName: string; preferredLanguage: "en" | "hi"; unitSystem: "metric" | "imperial" }) => {
    setError(null);
    try {
      const updated = await api.auth.updateProfile(data);
      setUser(updated);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
      throw err;
    }
  };

  const deleteAccount = async () => {
    setError(null);
    try {
      await api.auth.deleteAccount();
      setUser(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete account.");
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        deleteAccount,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
