/**
 * Calinfco Mobile - Firebase Client & Demo-Mode Fallback
 * 
 * Provides unified Firebase Auth & Firestore services for Expo React Native.
 * Operates in Demo Mode if EXPO_PUBLIC_FIREBASE_API_KEY is missing,
 * enabling immediate testing of Customer & Dealer flows with 65 realistic products.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { SEED_PRODUCTS } from '../constants/seed-data';
import { UserProfile, Product, Order } from '../types';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

export const isDemoMode =
  !apiKey ||
  apiKey === '' ||
  apiKey.includes('your-expo') ||
  apiKey.includes('demo') ||
  apiKey.includes('sample') ||
  apiKey.startsWith('AIzaSy') === false;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (!isDemoMode) {
  try {
    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[Calinfco Mobile] Connected to Live Firebase Project:', projectId);
  } catch (error) {
    console.warn('[Calinfco Mobile] Live Firebase init error, falling back to Demo Mode:', error);
  }
} else {
  console.log('[Calinfco Mobile] Running in Demo Mode (Zero Credentials Required)');
}

export { app, auth, db };

export const DEMO_PROFILES: Record<string, UserProfile> = {
  customer: {
    id: 'usr-cust-01',
    name: 'Amit Verma',
    email: 'amit.verma@gmail.com',
    phone: '+91 99887 76655',
    role: 'customer',
    dealerStatus: 'none',
    addresses: [
      {
        id: 'addr-cust-1',
        street: 'Flat 402, Green Glen Layout, Bellandur',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        isDefault: true,
      },
    ],
    referralCode: 'CAL-AMI03',
    createdAt: '2026-08-01T12:00:00Z',
    updatedAt: '2026-08-01T12:00:00Z',
  },
  pendingDealer: {
    id: 'usr-dealer-pending-01',
    name: 'Rajesh Sharma',
    email: 'rajesh.aquaworld@gmail.com',
    phone: '+91 98111 22334',
    role: 'customer', // Not yet dealer until approved!
    dealerStatus: 'pending',
    dealerDetails: {
      businessName: 'Aqua World Hardware & Sanitary',
      gstNumber: '07AAAAA0000A1Z5',
      tradeLicense: 'DL-TL-2026-8891',
      contactPerson: 'Rajesh Sharma',
      storeAddress: 'Shop 14, Main Market, Lajpat Nagar II',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110024',
      requestedAt: '2026-10-20T14:30:00Z',
    },
    addresses: [
      {
        id: 'addr-dlr-1',
        street: 'Shop 14, Main Market',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110024',
        isDefault: true,
      },
    ],
    referralCode: 'CAL-RAJ24',
    createdAt: '2026-10-20T14:25:00Z',
    updatedAt: '2026-10-20T14:30:00Z',
  },
  approvedDealer: {
    id: 'usr-dealer-approved-01',
    name: 'Kavita Reddy',
    email: 'kavita@deccanpuretech.com',
    phone: '+91 94400 55667',
    role: 'dealer',
    dealerStatus: 'approved',
    dealerDetails: {
      businessName: 'Deccan Puretech Appliances LLP',
      gstNumber: '36CCCCC2222C1Z8',
      tradeLicense: 'TS-HYD-7712',
      contactPerson: 'Kavita Reddy',
      storeAddress: 'Plot 45, Hitec City Commercial Hub',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      requestedAt: '2026-09-15T11:00:00Z',
      reviewedAt: '2026-09-16T15:00:00Z',
      reviewedBy: 'usr-admin-01',
    },
    addresses: [
      {
        id: 'addr-dlr-3',
        street: 'Plot 45, Hitec City',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
        isDefault: true,
      },
    ],
    referralCode: 'CAL-KAV81',
    createdAt: '2026-09-15T10:45:00Z',
    updatedAt: '2026-09-16T15:00:00Z',
  },
};
