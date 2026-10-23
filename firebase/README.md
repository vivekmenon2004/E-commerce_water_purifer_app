# Firebase Architecture & Security - Calinfco Water Purifiers

This directory contains Firestore security rules, composite indexes, and emulator configuration for the Calinfco platform.

## Collections Schema

1. `users`: Customer, Admin, and Technician profiles with role-based access.
2. `products`: Water purifier models (RO, UV, UF, Alkaline, Commercial), replacement filter cartridges, membranes, and AMC plans.
3. `orders`: Orders placed through the mobile app, item breakdown, delivery address, installation scheduling, and invoice status.
4. `serviceRequests`: On-demand service tickets (New installation, sediment filter flush, RO membrane replacement, water TDS inspection, maintenance).
5. `amcSubscriptions`: Annual Maintenance Contracts with scheduled periodic visits and warranty status.
6. `waterQualityLogs`: Customer water test logs (TDS, pH, Hardness) before and after purifier installation.
7. `technicians`: Field technician roster, assigned areas, and live job status.

## Local Emulators

To run Firestore locally without touching production credentials:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Start emulators
firebase emulators:start
```

The Firebase Emulator Suite UI will be accessible at: `http://localhost:4000`
Firestore port: `8080`
Auth port: `9099`

## Deploying Rules

```bash
firebase deploy --only firestore:rules,firestore:indexes
```
