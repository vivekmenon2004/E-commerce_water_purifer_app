# Calinfco Water Purifiers - Secure Admin Provisioning Guide

## Zero Self-Escalation Architecture

In accordance with `PROJECT_RULES.md` and Calinfco's security policy:
- **Clients can never assign the `admin` role to themselves.**
- All client-side registration calls (`signUpCustomer`) default strictly to `role: 'customer'`.
- Firestore security rules reject any creation or update attempts that assign `role == 'admin'`, self-assign `role == 'dealer'`, or set `dealerStatus == 'approved'`.
- The initial administrator account must be provisioned either through **trusted Firebase admin tooling** or directly via the **Firebase Console**.

---

## Method 1: Provisioning via the Firebase Console (No CLI Credentials Required)

This is the recommended method for cloud-hosted environments:

1. **Create the User Account**:
   - Open the [Firebase Console](https://console.firebase.google.com/).
   - Navigate to **Build** → **Authentication** → **Users** tab.
   - Click **Add User** and enter the admin email (e.g., `admin@calinfco.com`) and a strong temporary password.
   - Alternatively, register the account directly through the mobile app's Sign Up screen.

2. **Copy the User UID**:
   - In the **Users** table, copy the unique `User UID` (e.g., `AbC123dEf456GhI789`).

3. **Set the Role in Cloud Firestore**:
   - Navigate to **Build** → **Firestore Database**.
   - Open the `users` collection.
   - Select or add the document whose ID matches the copied `User UID`.
   - Add or update the following fields:
     - `role` (string): `"admin"`
     - `dealerStatus` (string): `"none"`
     - `name` (string): `"Operations Admin"`
     - `email` (string): `"admin@calinfco.com"`
     - `updatedAt` (string): current ISO timestamp (e.g. `2026-10-24T09:00:00Z`)

4. **Verify Admin Access**:
   - Navigate to the Admin Operations portal (`apps/admin` at `http://localhost:3000`).
   - The user is now recognized as an authorized administrator and has full permission to approve dealer applications, modify catalog items, and oversee orders.

---

## Method 2: Trusted CLI Script (Firebase Admin SDK)

For automated CI/CD deployments or staging environments:

1. **Download Service Account Key**:
   - In Firebase Console, go to **Project Settings** → **Service accounts**.
   - Click **Generate new private key** and save it securely as `service-account.json` in your repository root.
   - *CRITICAL*: Ensure `service-account.json` is listed in your `.gitignore` and NEVER committed to GitHub.

2. **Run the Provisioning Script**:
   ```bash
   node scripts/provision-admin.mjs --email admin@calinfco.com
   ```
   Or by UID:
   ```bash
   node scripts/provision-admin.mjs --uid <AUTH_UID>
   ```

3. **What the Script Does**:
   - Authenticates via the private service account key with elevated privileges.
   - Sets custom claims on the Firebase Auth user: `{ admin: true }`.
   - Upserts the Firestore document `users/{uid}` with `role: 'admin'`.

---

## Method 3: Local Development & Demo Mode

When developing locally without live Firebase credentials:
- Both `apps/admin` and `apps/mobile` automatically boot in **Demo Mode**.
- In `apps/admin`, the pre-configured administrator account (`admin@calinfco.com`) is loaded into memory with full access to the 65 mock products, dealer approval queues, and order management.
- In `apps/mobile`, the Persona Switcher allows instant switching between:
  - 👤 **Customer**: Normal retail catalog browsing and dealership application.
  - ⏳ **Pending Dealer**: Demonstrates the pending verification banner.
  - 🌟 **Approved Dealer**: Demonstrates wholesale dealer pricing (`30-45%` lower B2B pricing) across all 65 products.
