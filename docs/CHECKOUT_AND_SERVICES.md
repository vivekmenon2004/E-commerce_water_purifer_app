# Calinfco Checkout, Payments & Services Documentation

## 1. Overview
This document details the customer checkout, delivery address management, payment integration, order tracking, and technician service booking architecture for the Calinfco E-Commerce platform.

---

## 2. Delivery Address Management & OpenStreetMap

Delivery addresses support both **interactive geocoding with map preview** and a **100% reliable manual-entry fallback**:

### OpenStreetMap (OSM) Integration
- Component: `apps/mobile/src/components/osm-address-picker.tsx`
- **Map Preview**: Embeds OpenStreetMap tiles at the pinned latitude and longitude.
- **Geocoding**: Uses the OpenStreetMap Nominatim API (`https://nominatim.openstreetmap.org/search?format=json&q=...`) to search landmarks, areas, and postal codes in India.
- **Coordinates Storage**: Lat/Lon coordinates (`latitude`, `longitude`) are stored directly on the `UserAddress` object in Firestore `users/{uid}` and orders `shippingAddress`.
- **Manual-Entry Fallback**: When offline or if Nominatim is unreachable, users enter House/Flat, Street, Area, City, State, Landmark, and 6-digit PIN code. No blockers occur if GPS or map services fail.

---

## 3. Trusted Server-Side Order & Price Validation

To strictly prevent price tampering (e.g. client modifying retail price from ₹18,999 to ₹1):
- Server Route: `POST /api/checkout/validate` (`apps/admin/src/app/api/checkout/validate/route.ts`)
- Client Service: `CheckoutService.validateCartItems()` (`apps/mobile/src/lib/checkout-service.ts`)
- **Authoritative Validation**:
  1. Checks each line item against authoritative seed catalog and active Firestore inventory.
  2. Strictly overrides client-submitted unit prices with verified `retailPrice` (or `dealerPrice` for verified dealers).
  3. Validates warehouse inventory and automatically clamps requested quantities to `product.stock`.
  4. Server calculates promo discounts (`PURE10` for 10% off, `CALINFCO500` for 15% off), 18% GST, delivery fee thresholds (> ₹500 is free), and total payable.

---

## 4. Payment Architecture: Razorpay Test Mode & Fallback

### Security Standard: Zero Client Secrets Policy
- The `RAZORPAY_KEY_SECRET` is **NEVER** embedded, imported, or accessible in mobile client code.
- Mobile only receives the public `keyId` and the server-generated `orderId`.

### Two Payment Paths:

#### Path A: Live Razorpay Test Mode (Configured)
1. **Prerequisites**: Set in `.env`:
   ```bash
   RAZORPAY_KEY_ID=rzp_test_YourKeyIdHere
   RAZORPAY_KEY_SECRET=YourSecretKeyHere
   ```
2. **Order Creation**: Mobile calls `POST /api/checkout/razorpay/create-order`. The server invokes the official Razorpay Orders API (`https://api.razorpay.com/v1/orders`) using Basic Authentication and returns the `orderId`.
3. **Signature Verification**: After payment, mobile calls `POST /api/checkout/razorpay/verify-payment`. The server validates the HMAC-SHA256 signature using `crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id).digest('hex')`.

#### Path B: Clearly Labeled Mock-Payment Fallback (Active by default)
- When `RAZORPAY_KEY_SECRET` is not set or during offline/sandbox testing:
  - `POST /api/checkout/razorpay/create-order` automatically returns `{ success: true, isMock: true, keyId: 'rzp_test_mock_calinfco', orderId: 'order_mock_...' }`.
  - In mobile, a clearly labeled modal appears allowing developers and QA testers to simulate both **Payment Success** and **Payment Failure**.
  - Verified mock signatures follow format `mock_sig_<paymentId>`.

#### Path C: Cash on Delivery (COD)
- Placed directly with `paymentStatus: 'pending'` and `orderStatus: 'placed'`. Customer pays after installation and raw water TDS testing.

---

## 5. Duplicate Order Prevention & Idempotency

To prevent accidental duplicate orders if a user clicks the checkout button twice or payment callbacks trigger retries:
- Every checkout session generates a client `idempotencyKey` (e.g. `idem_<userId>_<timestamp>`).
- Endpoint `POST /api/checkout/create-order` tracks `processedIdempotencyKeys` and `processedPayments` (by `razorpayPaymentId`).
- If an order with the same key or payment ID is submitted again, the server suppresses duplicate creation and returns the existing order record with `{ isDuplicate: true }`.

---

## 6. Order History & Customer Cancellation

- Screen: `apps/mobile/src/app/orders/index.tsx` (List) and `apps/mobile/src/app/orders/[id].tsx` (Detail).
- Shows:
  - Order ID, date, status timeline (`placed` -> `confirmed` -> `dispatched` -> `installed`).
  - Delivery address with OpenStreetMap coordinates preview.
  - Line items, payment transaction ID, and price snapshot breakdown.
- **Customer Cancellation**:
  - In strict compliance with `firestore.rules`, customers may only self-cancel orders in `placed` or `confirmed` status. Once marked `dispatched` or `installed`, cancellation is locked.

---

## 7. Technician Service Booking (`serviceRequests`)

- Screen: `apps/mobile/src/app/services.tsx`
- Categories supported:
  1. `installation`: Free New Purifier Installation & Mounting.
  2. `water_test`: Comprehensive Raw Water TDS & Hardness Testing.
  3. `filter_replacement`: Filter Cartridge & RO Membrane Replacement.
  4. `repair`: Emergency Repair & Leakage Troubleshooting.
  5. `amc_visit`: Annual Maintenance Contract Checkup.
- Captures: Contact phone, alternate phone, delivery address (with OSM pin), preferred date/time slot, purifier model, and issue description.
- Persists to Firestore `serviceRequests` collection with auto-generated ID (e.g. `SRV-2026-XXXX`).
- Supports loading, success (with ticket reference number), and history tracking tabs.
