"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "./types";
import { isDemoMode, INITIAL_DEMO_USERS, auth, db } from "./firebase";
import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface AdminAuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({} as AdminAuthContextType);

const STORAGE_KEY = "calinfco_admin_session";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as UserProfile;
        if (parsed.role === "admin") return parsed;
      }
    } catch {
      // Ignore parse errors
    }
    if (isDemoMode) {
      return (
        INITIAL_DEMO_USERS.find(u => u.role === "admin") || {
          id: "usr-admin-01",
          name: "Vivek Menon",
          email: "admin@calinfco.com",
          phone: "+91 98765 43210",
          role: "admin",
          dealerStatus: "none",
          addresses: [],
          referralCode: "CAL-ADM01",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    if (isDemoMode) return false;
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as UserProfile;
        if (parsed.role === "admin") return false;
      }
    } catch {
      // Ignore
    }
    return true;
  });

  useEffect(() => {
    // Firebase live auth listener if not in demo mode
    if (!isDemoMode && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            if (db) {
              const snap = await getDoc(doc(db, "users", fbUser.uid));
              if (snap.exists()) {
                const uData = { id: snap.id, ...snap.data() } as UserProfile;
                if (uData.role === "admin") {
                  setUser(uData);
                  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(uData));
                } else {
                  console.warn("[AdminAuth] User exists but lacks 'admin' role:", uData.role);
                  setUser(null);
                  sessionStorage.removeItem(STORAGE_KEY);
                }
              }
            }
          } catch (err) {
            console.error("[AdminAuth] Error retrieving user profile:", err);
            setUser(null);
          }
        } else {
          setUser(null);
          sessionStorage.removeItem(STORAGE_KEY);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // In demo mode or offline
    if (isDemoMode || !auth) {
      const found = INITIAL_DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail);
      if (!found) {
        if (cleanEmail === "admin@calinfco.com" || cleanEmail.includes("admin")) {
          const newAdmin: UserProfile = {
            id: "usr-admin-01",
            name: "Vivek Menon (Operations Admin)",
            email: cleanEmail,
            phone: "+91 98765 43210",
            role: "admin",
            dealerStatus: "none",
            addresses: [],
            referralCode: "CAL-ADM01",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setUser(newAdmin);
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newAdmin));
          return { success: true };
        }
        return { success: false, error: "Invalid credentials or unauthorized user" };
      }

      if (found.role !== "admin") {
        return {
          success: false,
          error: "Access Denied: Account does not have administrator privileges.",
        };
      }

      setUser(found);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      return { success: true };
    }

    // Live Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (!db) {
        return { success: false, error: "Firestore not initialized" };
      }
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (!snap.exists()) {
        await fbSignOut(auth);
        return { success: false, error: "User profile not found in database" };
      }

      const uData = { id: snap.id, ...snap.data() } as UserProfile;
      if (uData.role !== "admin") {
        await fbSignOut(auth);
        return {
          success: false,
          error: "Access Denied: Only users with 'admin' role can access the Operations Portal.",
        };
      }

      setUser(uData);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(uData));
      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message || "Authentication failed" };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    if (!isDemoMode && auth) {
      fbSignOut(auth).catch(() => {});
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === "admin",
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
