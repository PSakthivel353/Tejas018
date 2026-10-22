"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, User } from "./types";

export const DEMO_USERS: Record<Role, User & { password: string }> = {
  candidate: {
    id: "cand101",
    name: "Arun Kumar",
    email: "candidate@skillbridge.org",
    password: "password123",
    role: "candidate",
    trade: "CNC Operation",
    phone: "+91 98765 43210",
    seeker_id: 101,
  },
  recruiter: {
    id: "rec201",
    name: "S. Meenakshi",
    email: "recruiter@kaveriprecision.com",
    password: "password123",
    role: "recruiter",
    companyName: "Kaveri Precision Works",
    phone: "+91 98422 12345",
    employer_id: 1,
  },
  admin: {
    id: "admin001",
    name: "Dr. K. Ramanathan, IAS",
    email: "admin@skillbridge.gov.in",
    password: "password123",
    role: "admin",
    phone: "+91 94433 99887",
  },
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string, role?: Role) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (role: Role) => void;
  signup: (userData: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Role;
    companyName?: string;
    trade?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "skillbridge_auth_user";
const REGISTERED_USERS_KEY = "skillbridge_registered_users";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session: checks sessionStorage first so each browser tab can be logged in as a different role!
  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserSession = (authUser: User) => {
    setUser(authUser);
    try {
      // Store in sessionStorage for this tab, and fallback to localStorage
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    } catch {
      /* ignore */
    }
  };

  const getCustomUsers = (): Array<User & { password: string }> => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const login = async (identifier: string, password: string, roleHint?: Role) => {
    const trimmedId = identifier.trim().toLowerCase();
    const allUsers = [...Object.values(DEMO_USERS), ...getCustomUsers()];

    const matched = allUsers.find(
      (u) =>
        (u.id.toLowerCase() === trimmedId || u.email.toLowerCase() === trimmedId) &&
        (!roleHint || u.role === roleHint),
    );

    if (!matched) {
      return { success: false, error: "No account found matching this ID or Email for the chosen role." };
    }

    if (matched.password !== password && password !== "password123") {
      return { success: false, error: "Invalid password. (Hint for demo: password123)" };
    }

    const authUser: User = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      role: matched.role,
      companyName: matched.companyName,
      trade: matched.trade,
      phone: matched.phone,
      seeker_id: matched.seeker_id || (matched.role === "candidate" ? 101 : undefined),
      employer_id: matched.employer_id || (matched.role === "recruiter" ? 1 : undefined),
    };

    saveUserSession(authUser);
    return { success: true };
  };

  const quickLogin = (role: Role) => {
    const demo = DEMO_USERS[role];
    const authUser: User = {
      id: demo.id,
      name: demo.name,
      email: demo.email,
      role: demo.role,
      companyName: demo.companyName,
      trade: demo.trade,
      phone: demo.phone,
      seeker_id: demo.seeker_id,
      employer_id: demo.employer_id,
    };
    saveUserSession(authUser);
  };

  const signup = async (data: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Role;
    companyName?: string;
    trade?: string;
    phone?: string;
  }) => {
    if (!data.id.trim() || !data.name.trim() || !data.email.trim() || !data.password) {
      return { success: false, error: "All required fields must be filled." };
    }

    const allUsers = [...Object.values(DEMO_USERS), ...getCustomUsers()];
    const exists = allUsers.some(
      (u) => u.id.toLowerCase() === data.id.trim().toLowerCase() || u.email.toLowerCase() === data.email.trim().toLowerCase(),
    );

    if (exists) {
      return { success: false, error: "An account with this ID or Email already exists." };
    }

    const newUser: User & { password: string } = {
      id: data.id.trim(),
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
      role: data.role,
      companyName: data.companyName?.trim(),
      trade: data.trade?.trim(),
      phone: data.phone?.trim(),
      seeker_id: data.role === "candidate" ? Math.floor(Math.random() * 800) + 200 : undefined,
      employer_id: data.role === "recruiter" ? 1 : undefined,
    };

    const existingCustom = getCustomUsers();
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([...existingCustom, newUser]));

    const authUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      companyName: newUser.companyName,
      trade: newUser.trade,
      phone: newUser.phone,
      seeker_id: newUser.seeker_id,
      employer_id: newUser.employer_id,
    };

    saveUserSession(authUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, quickLogin, signup, logout }}>
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
