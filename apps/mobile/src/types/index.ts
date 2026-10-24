/**
 * Calinfco Water Purifiers - Shared Type Definitions for Mobile App
 */

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
  requestedAt: string;
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
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  dealerStatus: DealerStatus;
  dealerDetails?: DealerDetails;
  addresses: UserAddress[];
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = 
  | 'water purifiers' 
  | 'dispensers' 
  | 'pumps' 
  | 'filters' 
  | 'spare parts';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  description: string;
  retailPrice: number;
  mrp: number;
  dealerPrice: number;
  stock: number;
  isActive: boolean;
  imageUrl: string;
  purificationStages?: number;
  purificationTech?: string[];
  waterSourceSuitability?: string;
  tankCapacityLiters?: number;
  warrantyMonths: number;
  ratingAverage: number;
  ratingCount: number;
  specifications?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unitPrice: number;
  mrp: number;
  quantity: number;
  total: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  customerId: string;
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
  id: string;
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

export interface Referral {
  id: string;
  referrerId: string;
  referrerCode: string;
  refereeId: string;
  refereeEmail: string;
  status: 'pending' | 'completed' | 'rewarded';
  rewardPoints: number;
  createdAt: string;
  completedAt?: string;
}
