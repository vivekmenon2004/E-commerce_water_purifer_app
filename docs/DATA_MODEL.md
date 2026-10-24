# Calinfco Water Purifiers - Shared Data Model & Schema

All primary entities reside in Cloud Firestore with role-based security rules. This schema is shared across `apps/mobile` (Expo React Native), `apps/admin` (Next.js Operations Portal), and backend automation workflows.

---

## Security & Role Model Overview

Calinfco enforces a zero-trust role model in Firestore:
- **`customer`**: Standard registered end-user. Can browse products, view retail prices, place orders, book service requests, and submit a dealer application.
- **`dealer`**: Verified B2B wholesale partner. Has access to wholesale `dealerPrice` across all 5 catalog categories, bulk order management, and dealer credit payment terms.
- **`technician`**: Field service engineer. Has access to assigned installation and filter maintenance service tickets, and can record pre/post TDS water readings.
- **`admin`**: Operations administrator. Has full access to manage catalog products, approve/reject dealer applications, dispatch service tickets, and oversee all orders.

> [!IMPORTANT]
> **Zero Self-Escalation Policy**: Clients are strictly prohibited by Firestore Security Rules from assigning `role: 'admin'`, self-promoting to `role: 'dealer'`, or setting `dealerStatus: 'approved'`. Dealer applications enter `dealerStatus: 'pending'` and must be approved by an administrator.

---

## Collections & Schemas

### 1. `users`
Represents customers, dealers, technicians, and administrators. Document ID is the Firebase Auth `UID`.

```typescript
export type UserRole = 'customer' | 'dealer' | 'technician' | 'admin';
export type DealerStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface DealerDetails {
  businessName: string;
  gstNumber: string;
  panNumber?: string;
  tradeLicense?: string;
  contactPerson: string;
  storeAddress: string;
  city: string;
  state: string;
  pincode: string;
  requestedAt: string; // ISO 8601
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface UserAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string;
  phone?: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  dealerStatus: DealerStatus;
  dealerDetails?: DealerDetails;
  addresses: UserAddress[];
  referralCode: string; // e.g. "CAL-VIV49"
  referredBy?: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}
```

---

### 2. `products`
Hardware purifiers, water dispensers, booster pumps, filter cartridges, and spare parts.

```typescript
export type ProductCategory = 
  | 'water purifiers' 
  | 'dispensers' 
  | 'pumps' 
  | 'filters' 
  | 'spare parts';

export interface Product {
  id: string; // e.g. "calinfco-aquashield-pro"
  sku: string; // e.g. "CAL-WP-001"
  name: string;
  category: ProductCategory;
  description: string;
  retailPrice: number; // Regular customer price in INR
  mrp: number; // Maximum retail price in INR
  dealerPrice: number; // Wholesale price for verified dealers
  stock: number;
  isActive: boolean;
  imageUrl: string; // Product-specific high-res image URL
  
  // Specifications
  purificationStages?: number; // e.g. 10
  purificationTech?: Array<'RO' | 'UV' | 'UF' | 'Alkaline' | 'TDS_Controller' | 'Copper_Zinc'>;
  waterSourceSuitability?: string; // e.g. "Borewell / Tanker TDS up to 2500 ppm"
  tankCapacityLiters?: number;
  warrantyMonths: number;
  ratingAverage: number;
  ratingCount: number;
  specifications?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
```

---

### 3. `orders`
E-commerce orders placed by customers or verified dealers.

```typescript
export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unitPrice: number; // retailPrice for customers, dealerPrice for verified dealers
  mrp: number;
  quantity: number;
  total: number;
  imageUrl: string;
}

export interface Order {
  id: string; // e.g. "ORD-2026-1001"
  customerId: string; // User UID
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  userRoleAtPurchase: 'customer' | 'dealer';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: 'upi' | 'card' | 'cod' | 'dealer_credit';
  paymentStatus: 'paid' | 'pending' | 'failed';
  orderStatus: 'placed' | 'confirmed' | 'dispatched' | 'installed' | 'cancelled';
  shippingAddress: UserAddress;
  cancellationReason?: string;
  installationScheduledDate?: string;
  assignedTechnicianId?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 4. `serviceRequests`
Technician dispatch tickets for installation, water testing, repair, and filter maintenance.

```typescript
export type ServiceRequestType = 
  | 'water_test' 
  | 'installation' 
  | 'filter_replacement' 
  | 'repair' 
  | 'amc_visit';

export type ServiceRequestStatus = 
  | 'open' 
  | 'assigned' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface ServiceRequest {
  id: string; // e.g. "SRV-2026-5001"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderId?: string;
  requestType: ServiceRequestType;
  status: ServiceRequestStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  technicianId?: string;
  technicianName?: string;
  scheduledSlot: string;
  tdsReadingBeforePpm?: number;
  tdsReadingAfterPpm?: number;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 5. `referrals`
Customer referral tracking and reward credits.

```typescript
export interface Referral {
  id: string; // e.g. "REF-84920"
  referrerId: string; // UID of user who shared code
  referrerCode: string; // e.g. "CAL-VIV49"
  refereeId: string; // UID of newly signed-up user
  refereeEmail: string;
  status: 'pending' | 'completed' | 'rewarded';
  rewardPoints: number; // e.g. 500 points (₹500 discount)
  createdAt: string;
  completedAt?: string;
}
```
