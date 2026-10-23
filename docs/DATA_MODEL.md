# Calinfco Water Purifiers - Data Model & Schema

All primary entities reside in Cloud Firestore with role-based security rules.

## Collections

### 1. `users`
Represents customers, administrators, and field technicians.
```typescript
interface UserProfile {
  id: string; // Auth UID
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin' | 'technician';
  addresses: Array<{
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
    isDefault: boolean;
  }>;
  createdAt: string; // ISO 8601
  updatedAt: string;
}
```

### 2. `products`
Purifier hardware, replacement filter cartridges, and warranty AMC plans.
```typescript
interface Product {
  id: string; // e.g. "calinfco-aquashield-pro"
  name: string;
  category: 'purifier' | 'filter' | 'amc';
  purificationStages: number; // e.g. 10
  purificationTech: Array<'RO' | 'UV' | 'UF' | 'Alkaline' | 'TDS_Controller'>;
  mrp: number; // in INR
  sellingPrice: number;
  stockCount: number;
  waterSourceSuitability: string; // e.g. "TDS up to 2500 ppm (Borewell/Tanker)"
  tankCapacityLiters?: number;
  warrantyMonths: number;
  ratingAverage: number;
  ratingCount: number;
  isActive: boolean;
}
```

### 3. `orders`
E-commerce orders placed from the mobile app.
```typescript
interface Order {
  id: string; // e.g. "ORD-9482"
  customerId: string;
  items: Array<{
    productId: string;
    name: string;
    category: 'purifier' | 'filter' | 'amc';
    unitPrice: number;
    quantity: number;
  }>;
  totalAmount: number;
  paymentMethod: 'upi' | 'card' | 'cod';
  paymentStatus: 'paid' | 'pending' | 'failed';
  orderStatus: 'placed' | 'confirmed' | 'dispatched' | 'installed' | 'cancelled';
  shippingAddress: string;
  installationScheduledDate?: string;
  assignedTechnicianId?: string;
  createdAt: string;
}
```

### 4. `serviceRequests`
Technician field tickets for installation, water testing, and filter maintenance.
```typescript
interface ServiceRequest {
  id: string; // e.g. "SRV-2089"
  customerId: string;
  orderId?: string;
  requestType: 'water_test' | 'installation' | 'filter_replacement' | 'repair' | 'amc_visit';
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  technicianId?: string;
  technicianName?: string;
  scheduledSlot: string;
  customerPhone: string;
  customerAddress: string;
  tdsReadingBeforePpm?: number;
  tdsReadingAfterPpm?: number;
  resolutionNotes?: string;
  createdAt: string;
}
```

### 5. `amcSubscriptions`
Annual Maintenance Contracts for purifier lifecycle tracking.
```typescript
interface AMCSubscription {
  id: string;
  customerId: string;
  purifierModel: string;
  planName: string;
  startDate: string;
  endDate: string;
  freeFilterChangesRemaining: number;
  maintenanceVisitsRemaining: number;
  status: 'active' | 'expired' | 'renewed';
}
```
