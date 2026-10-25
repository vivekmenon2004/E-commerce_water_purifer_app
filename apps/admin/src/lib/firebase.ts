/**
 * Calinfco Admin - Firebase Client & Demo-Mode Fallback
 * 
 * Provides unified Firebase Auth & Firestore services.
 * If credentials are missing in .env.local, automatically operates in Demo Mode
 * with pre-seeded mock products, mock dealer applications, and role-switching.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { UserProfile, Order, ServiceRequest } from './types';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Real Firebase Web API Keys always start with 'AIzaSy' and are 39 chars long.
// If missing, empty, or using dummy/demo strings, run safely in zero-breakage Demo Mode.
export const isDemoMode =
  !apiKey ||
  apiKey === '' ||
  apiKey.includes('your-next') ||
  apiKey.includes('demo') ||
  apiKey.includes('sample') ||
  apiKey.startsWith('AIzaSy') === false;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (!isDemoMode) {
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[Calinfco Admin] Connected to Live Firebase Project:', projectId);
  } catch (error) {
    console.warn('[Calinfco Admin] Live Firebase initialization failed, falling back to Demo Mode:', error);
  }
} else {
  console.log('[Calinfco Admin] Running in Demo Mode (Zero Credentials Required)');
}

export { app, auth, db };

// ==========================================
// DEMO MODE IN-MEMORY DATA STORE
// ==========================================

export const INITIAL_DEMO_USERS: UserProfile[] = [
  {
    id: 'usr-admin-01',
    name: 'Vivek Menon (Operations Head)',
    email: 'admin@calinfco.com',
    phone: '+91 98765 43210',
    role: 'admin',
    dealerStatus: 'none',
    addresses: [
      {
        id: 'addr-admin-1',
        street: 'Calinfco HQ, Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        postalCode: '201309',
        isDefault: true,
      },
    ],
    referralCode: 'CAL-ADM01',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'usr-dealer-pending-01',
    name: 'Rajesh Sharma (Aqua World Traders)',
    email: 'rajesh.aquaworld@gmail.com',
    phone: '+91 98111 22334',
    role: 'customer', // Still customer until approved!
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
  {
    id: 'usr-dealer-pending-02',
    name: 'Sunil Patel (Patel Water Solutions)',
    email: 'sunil.patel.water@gmail.com',
    phone: '+91 97222 33445',
    role: 'customer',
    dealerStatus: 'pending',
    dealerDetails: {
      businessName: 'Patel RO & Plumbing Wholesale',
      gstNumber: '24BBBBB1111B1Z2',
      tradeLicense: 'GJ-AHM-4920',
      contactPerson: 'Sunil Patel',
      storeAddress: '102 Silicon Arcade, SG Highway',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380054',
      requestedAt: '2026-10-22T09:15:00Z',
    },
    addresses: [
      {
        id: 'addr-dlr-2',
        street: '102 Silicon Arcade',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postalCode: '380054',
        isDefault: true,
      },
    ],
    referralCode: 'CAL-SUN54',
    createdAt: '2026-10-22T09:10:00Z',
    updatedAt: '2026-10-22T09:15:00Z',
  },
  {
    id: 'usr-dealer-approved-01',
    name: 'Kavita Reddy (Deccan Puretech)',
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
  {
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
];

export const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'ORD-2026-1001',
    customerId: 'usr-dealer-approved-01',
    customerName: 'Kavita Reddy (Deccan Puretech LLP)',
    customerEmail: 'kavita@deccanpuretech.com',
    customerPhone: '+91 94400 55667',
    userRoleAtPurchase: 'dealer',
    items: [
      {
        productId: 'cal-wp-001',
        sku: 'CAL-WP-001',
        name: 'Calinfco AquaShield Pro 10X',
        category: 'water purifiers',
        unitPrice: 12800, // Dealer wholesale price!
        mrp: 24999,
        quantity: 5,
        total: 64000,
        imageUrl: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=800&q=80',
      },
      {
        productId: 'cal-flt-001',
        sku: 'CAL-FLT-001',
        name: 'Calinfco High-Rejection 75 GPD RO Membrane',
        category: 'filters',
        unitPrice: 880,
        mrp: 2199,
        quantity: 20,
        total: 17600,
        imageUrl: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=800&q=80',
      },
    ],
    subtotal: 81600,
    discount: 0,
    tax: 14688,
    totalAmount: 96288,
    paymentMethod: 'dealer_credit',
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    shippingAddress: {
      id: 'addr-dlr-3',
      street: 'Plot 45, Hitec City',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500081',
      isDefault: true,
    },
    createdAt: '2026-10-23T11:20:00Z',
    updatedAt: '2026-10-23T11:25:00Z',
  },
  {
    id: 'ORD-2026-1002',
    customerId: 'usr-cust-01',
    customerName: 'Amit Verma',
    customerEmail: 'amit.verma@gmail.com',
    customerPhone: '+91 99887 76655',
    userRoleAtPurchase: 'customer',
    items: [
      {
        productId: 'cal-wp-001',
        sku: 'CAL-WP-001',
        name: 'Calinfco AquaShield Pro 10X',
        category: 'water purifiers',
        unitPrice: 18999, // Customer retail price
        mrp: 24999,
        quantity: 1,
        total: 18999,
        imageUrl: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=800&q=80',
      },
    ],
    subtotal: 18999,
    discount: 1000,
    tax: 3239,
    totalAmount: 21238,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    orderStatus: 'placed',
    shippingAddress: {
      id: 'addr-cust-1',
      street: 'Flat 402, Green Glen Layout, Bellandur',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
      isDefault: true,
    },
    installationScheduledDate: '2026-10-26',
    createdAt: '2026-10-24T06:15:00Z',
    updatedAt: '2026-10-24T06:15:00Z',
  },
];

export const INITIAL_DEMO_SERVICES: ServiceRequest[] = [
  {
    id: 'SRV-2089',
    customerId: 'usr-cust-02',
    customerName: 'Kiran Nambiar',
    customerPhone: '+91 98450 11223',
    customerAddress: 'HSR Layout Sector 2, Bangalore - 560102',
    requestType: 'water_test',
    status: 'assigned',
    priority: 'medium',
    technicianId: 'tech-01',
    technicianName: 'Ramesh Kumar',
    scheduledSlot: 'Today 16:00 - 18:00',
    tdsReadingBeforePpm: 520,
    tdsReadingAfterPpm: undefined,
    resolutionNotes: 'Customer requested TDS test after muddy borewell water report.',
    createdAt: '2026-10-24T08:00:00Z',
    updatedAt: '2026-10-24T09:30:00Z',
  },
  {
    id: 'SRV-2088',
    customerId: 'usr-cust-03',
    customerName: 'Srinivas Rao',
    customerPhone: '+91 97311 44556',
    customerAddress: 'Koramangala 4th Block, Bangalore - 560034',
    requestType: 'filter_replacement',
    status: 'in_progress',
    priority: 'high',
    technicianId: 'tech-02',
    technicianName: 'Amit K.',
    scheduledSlot: 'Today 14:00 - 15:30',
    tdsReadingBeforePpm: 420,
    tdsReadingAfterPpm: undefined,
    resolutionNotes: 'Replacing RO membrane and sediment pre-filter.',
    createdAt: '2026-10-24T07:15:00Z',
    updatedAt: '2026-10-24T10:00:00Z',
  },
  {
    id: 'SRV-2087',
    customerId: 'usr-cust-04',
    customerName: 'Meenakshi Sundaram',
    customerPhone: '+91 94440 77889',
    customerAddress: 'JP Nagar Phase 6, Bangalore - 560078',
    orderId: 'ORD-2026-1002',
    requestType: 'installation',
    status: 'completed',
    priority: 'high',
    technicianId: 'tech-03',
    technicianName: 'Suresh P.',
    scheduledSlot: 'Today 11:00 - 12:45',
    tdsReadingBeforePpm: 680,
    tdsReadingAfterPpm: 74,
    resolutionNotes: 'Installed Calinfco AquaShield Pro 10X. Pure water TDS verified at 74 ppm.',
    createdAt: '2026-10-24T05:30:00Z',
    updatedAt: '2026-10-24T12:45:00Z',
  },
  {
    id: 'SRV-2086',
    customerId: 'usr-cust-05',
    customerName: 'Aditi Roy',
    customerPhone: '+91 98800 33445',
    customerAddress: '12th Main, Indiranagar, Bangalore - 560038',
    requestType: 'repair',
    status: 'completed',
    priority: 'critical',
    technicianId: 'tech-04',
    technicianName: 'Deepak S.',
    scheduledSlot: 'Today 09:30 - 10:30',
    tdsReadingBeforePpm: 120,
    tdsReadingAfterPpm: 78,
    resolutionNotes: 'Emergency leakage fixed. Elbow connector replaced under warranty.',
    createdAt: '2026-10-24T04:00:00Z',
    updatedAt: '2026-10-24T10:30:00Z',
  },
];
