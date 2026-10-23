# Calinfco Water Purifiers - Developer Setup Guide

This guide describes how to run `apps/mobile`, `apps/admin`, Firebase Emulators, and n8n workflows locally.

## Prerequisites

- **Node.js**: `v20.x` or higher (verified on Node `v24.x`)
- **npm**: `v10.x` or `v11.x`
- **Android Studio** (for Android Emulator) or Expo Go on a physical Android device

---

## 1. Running the Admin Website (Next.js)

The admin site runs independently inside `apps/admin`:

```bash
# Navigate to admin app
cd apps/admin

# Setup environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Admin dashboard opens at: **`http://localhost:3000`**

Available routes:
- `http://localhost:3000/` - Operations Overview
- `http://localhost:3000/purifiers` - Purifier & Filter Catalog
- `http://localhost:3000/orders` - Orders & Installations
- `http://localhost:3000/services` - Field Services & TDS Tickets
- `http://localhost:3000/customers` - Customers & AMC Directory

---

## 2. Running the Mobile App (Expo / React Native)

The mobile application runs independently inside `apps/mobile`:

```bash
# Navigate to mobile app
cd apps/mobile

# Setup environment variables
cp .env.example .env

# Start Expo development server
npm start

# Or directly target Android
npm run android

# Or web preview
npm run web
```

Scan the QR code in the terminal using the **Expo Go** app on your Android device, or press `a` in the terminal to launch the Android emulator.

---

## 3. Running from Monorepo Root

You can also orchestrate commands directly from the monorepo root:

```bash
# Run Next.js Admin
npm run dev:admin

# Run Expo Mobile App
npm run dev:mobile

# Build Admin for production
npm run build:admin

# Run lint checks
npm run lint:admin
```

---

## 4. Running Firebase Emulators Locally

```bash
cd firebase
firebase emulators:start
```

- Emulator UI: `http://localhost:4000`
- Firestore: `http://localhost:8080`
- Auth: `http://localhost:9099`

---

## 5. Importing n8n Automations

1. Start n8n locally: `npx n8n`
2. Open `http://localhost:5678`
3. Click **Workflows** > **Import from File**
4. Select files from `automation/n8n/workflows/`:
   - `order-confirmation-notification.json`
   - `service-request-dispatch.json`
   - `filter-replacement-reminder.json`
