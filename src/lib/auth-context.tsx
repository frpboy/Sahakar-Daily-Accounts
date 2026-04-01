"use client";

import {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { UserRole } from "@/db/schema";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  outletId: string | null;
  outletName: string | null;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USER: User = {
  id: "admin-rahul",
  name: "Rahul",
  email: "frpboy12@gmail.com",
  phone: null,
  role: "admin",
  outletId: null,
  outletName: null,
  isActive: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        user: DEFAULT_USER,
        isLoading: false,
        isAuthenticated: true,
        setUser: () => {},
        logout: () => {},
      }}
    >
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
