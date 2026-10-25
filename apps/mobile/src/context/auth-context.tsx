import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { auth, db, isDemoMode, DEMO_PROFILES } from '../lib/firebase';
import { UserProfile, DealerDetails, UserAddress } from '../types';
import {
  registerForPushNotificationsAsync,
  saveDevicePushToken,
  PushRegistrationResult,
} from '../lib/push-notifications';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  isDealer: boolean;
  isPendingDealer: boolean;
  pushStatus: PushRegistrationResult | null;
  refreshPushToken: () => Promise<PushRegistrationResult>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpCustomer: (name: string, email: string, phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  applyForDealer: (details: Omit<DealerDetails, 'requestedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (name: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  addAddress: (address: Omit<UserAddress, 'id'>) => Promise<{ success: boolean; address?: UserAddress; error?: string }>;
  updateAddress: (addressId: string, address: Partial<UserAddress>) => Promise<{ success: boolean; error?: string }>;
  deleteAddress: (addressId: string) => Promise<{ success: boolean; error?: string }>;
  setDefaultAddress: (addressId: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchDemoPersona: (personaKey: 'customer' | 'pendingDealer' | 'approvedDealer') => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    return isDemoMode ? DEMO_PROFILES.customer : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!isDemoMode);
  const [pushStatus, setPushStatus] = useState<PushRegistrationResult | null>(null);

  const initPushRegistration = async (targetUser: UserProfile | null): Promise<PushRegistrationResult> => {
    try {
      const res = await registerForPushNotificationsAsync();
      setPushStatus(res);
      if (res.status === 'registered' && res.token && targetUser) {
        await saveDevicePushToken(targetUser.id, {
          token: res.token,
          nativeFcmToken: res.nativeFcmToken,
          platform: res.platform,
        });
      }
      return res;
    } catch (e: unknown) {
      const err = e as Error;
      const failResult: PushRegistrationResult = {
        status: 'unconfigured',
        token: null,
        platform: 'android',
        error: err.message,
      };
      setPushStatus(failResult);
      return failResult;
    }
  };

  useEffect(() => {
    if (user) {
      initPushRegistration(user);
    }
  }, [user?.id]);

  const refreshPushToken = async () => {
    return initPushRegistration(user);
  };

  useEffect(() => {
    if (isDemoMode || !auth || !db) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db as any, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUser(snap.data() as UserProfile);
          } else {
            // Document not yet created or external provider
            const basicProfile: UserProfile = {
              id: fbUser.uid,
              name: fbUser.displayName || 'Calinfco Customer',
              email: fbUser.email || '',
              phone: '',
              role: 'customer',
              dealerStatus: 'none',
              addresses: [],
              referralCode: `CAL-${fbUser.uid.slice(0, 5).toUpperCase()}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, basicProfile);
            setUser(basicProfile);
          }
        } catch (err) {
          console.error('[Mobile Auth] Error fetching user profile:', err);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    if (isDemoMode) {
      // Demo authentication simulation
      const found = Object.values(DEMO_PROFILES).find(p => p.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setUser(found);
        return { success: true };
      }
      // Fallback create demo customer
      const demoCust: UserProfile = {
        id: `demo-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        phone: '+91 98765 00000',
        role: 'customer',
        dealerStatus: 'none',
        addresses: [],
        referralCode: `CAL-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(demoCust);
      return { success: true };
    }

    if (!auth) return { success: false, error: 'Firebase Auth not initialized' };

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sign in' };
    }
  };

  const signUpCustomer = async (name: string, email: string, phone: string, pass: string) => {
    if (isDemoMode) {
      const newCust: UserProfile = {
        id: `demo-user-${Date.now()}`,
        name,
        email,
        phone,
        role: 'customer',
        dealerStatus: 'none',
        addresses: [],
        referralCode: `CAL-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(newCust);
      return { success: true };
    }

    if (!auth || !db) return { success: false, error: 'Firebase not initialized' };

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newProfile: UserProfile = {
        id: cred.user.uid,
        name,
        email,
        phone,
        role: 'customer',
        dealerStatus: 'none',
        addresses: [],
        referralCode: `CAL-${cred.user.uid.slice(0, 5).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db as any, 'users', cred.user.uid), newProfile);
      setUser(newProfile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const applyForDealer = async (details: Omit<DealerDetails, 'requestedAt'>) => {
    if (!user) return { success: false, error: 'Must be logged in to apply for dealer account' };

    const dealerDetails: DealerDetails = {
      ...details,
      requestedAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      const updated: UserProfile = {
        ...user,
        dealerStatus: 'pending',
        dealerDetails,
        updatedAt: new Date().toISOString(),
      };
      setUser(updated);
      return { success: true };
    }

    if (!db) return { success: false, error: 'Firestore not initialized' };

    try {
      const userRef = doc(db as any, 'users', user.id);
      await updateDoc(userRef, {
        dealerStatus: 'pending',
        dealerDetails,
        updatedAt: new Date().toISOString(),
      });
      setUser(prev => prev ? { ...prev, dealerStatus: 'pending', dealerDetails } : null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Dealer request submission failed' };
    }
  };

  const updateProfile = async (name: string, phone: string) => {
    if (!user) return { success: false, error: 'User not signed in' };

    const updatedUser: UserProfile = {
      ...user,
      name,
      phone,
      updatedAt: new Date().toISOString(),
    };
    setUser(updatedUser);

    if (!isDemoMode && db) {
      try {
        const userRef = doc(db as any, 'users', user.id);
        await updateDoc(userRef, {
          name,
          phone,
          updatedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.warn('[AuthContext] Firestore updateProfile failed:', err);
      }
    }

    return { success: true };
  };

  const addAddress = async (addressData: Omit<UserAddress, 'id'>) => {
    if (!user) return { success: false, error: 'User not signed in' };

    const newId = `addr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const isFirst = (user.addresses || []).length === 0;
    const isDefault = addressData.isDefault || isFirst;

    const newAddress: UserAddress = {
      ...addressData,
      id: newId,
      isDefault,
    };

    const updatedAddresses = (user.addresses || []).map(a =>
      isDefault ? { ...a, isDefault: false } : a
    );
    updatedAddresses.push(newAddress);

    const updatedUser: UserProfile = {
      ...user,
      addresses: updatedAddresses,
      updatedAt: new Date().toISOString(),
    };
    setUser(updatedUser);

    if (!isDemoMode && db) {
      try {
        const userRef = doc(db as any, 'users', user.id);
        await updateDoc(userRef, {
          addresses: updatedAddresses,
          updatedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.warn('[AuthContext] Firestore addAddress failed:', err);
      }
    }

    return { success: true, address: newAddress };
  };

  const updateAddress = async (addressId: string, updates: Partial<UserAddress>) => {
    if (!user) return { success: false, error: 'User not signed in' };

    const updatedAddresses = (user.addresses || []).map(addr => {
      if (addr.id === addressId) {
        return { ...addr, ...updates };
      }
      if (updates.isDefault) {
        return { ...addr, isDefault: false };
      }
      return addr;
    });

    const updatedUser: UserProfile = {
      ...user,
      addresses: updatedAddresses,
      updatedAt: new Date().toISOString(),
    };
    setUser(updatedUser);

    if (!isDemoMode && db) {
      try {
        const userRef = doc(db as any, 'users', user.id);
        await updateDoc(userRef, {
          addresses: updatedAddresses,
          updatedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.warn('[AuthContext] Firestore updateAddress failed:', err);
      }
    }

    return { success: true };
  };

  const deleteAddress = async (addressId: string) => {
    if (!user) return { success: false, error: 'User not signed in' };

    let updatedAddresses = (user.addresses || []).filter(a => a.id !== addressId);
    // If deleted address was default, set first remaining as default
    if (updatedAddresses.length > 0 && !updatedAddresses.some(a => a.isDefault)) {
      updatedAddresses[0].isDefault = true;
    }

    const updatedUser: UserProfile = {
      ...user,
      addresses: updatedAddresses,
      updatedAt: new Date().toISOString(),
    };
    setUser(updatedUser);

    if (!isDemoMode && db) {
      try {
        const userRef = doc(db as any, 'users', user.id);
        await updateDoc(userRef, {
          addresses: updatedAddresses,
          updatedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.warn('[AuthContext] Firestore deleteAddress failed:', err);
      }
    }

    return { success: true };
  };

  const setDefaultAddress = async (addressId: string) => {
    return updateAddress(addressId, { isDefault: true });
  };

  const signOut = async () => {
    if (isDemoMode) {
      setUser(null);
      return;
    }
    if (auth) {
      await fbSignOut(auth);
    }
    setUser(null);
  };

  const switchDemoPersona = (personaKey: 'customer' | 'pendingDealer' | 'approvedDealer') => {
    setUser(DEMO_PROFILES[personaKey]);
  };

  const isDealer = user?.role === 'dealer' && user?.dealerStatus === 'approved';
  const isPendingDealer = user?.dealerStatus === 'pending';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoMode,
        isDealer,
        isPendingDealer,
        pushStatus,
        refreshPushToken,
        signIn,
        signUpCustomer,
        applyForDealer,
        updateProfile,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        signOut,
        switchDemoPersona,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
