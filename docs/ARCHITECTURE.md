# Calinfco Water Purifiers - Architecture Documentation

## 1. System Overview

Calinfco is an enterprise-grade water purifier e-commerce and field operations ecosystem tailored to the Indian residential and commercial water purification market.

```
                              ┌─────────────────────────────────────────┐
                              │      Calinfco Customer Mobile App       │
                              │ (Expo SDK 58 / React Native TypeScript) │
                              │   - TDS Water Health Meter & Monitor    │
                              │   - RO+UV Purifier & Filter Catalog     │
                              │   - Doorstep Technician Booking         │
                              └────────────────────┬────────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Calinfco Admin Website      │       │     Cloud Firestore Database    │
│ (Next.js 16 App Router / Tailwind) <---> │   - Users & Addresses           │
│   - Real-time Operations KPIs   │       │   - Purifier Catalog & Inventory │
│   - Dispatch & Service Control  │       │   - Customer Orders             │
│   - AMC & Warranty Management   │       │   - Service Requests & TDS Logs │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 │ Webhook Events                          │ Webhook Triggers
                 ▼                                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          n8n Automation Engine                            │
│   - /webhook/order-created      -> Installation ticket auto-dispatch      │
│   - /webhook/service-dispatch   -> Technician zone assignment & SMS/WA    │
│   - Cron (Daily 09:00 AM)       -> Filter life calculation & AMC reminders│
└───────────────────────────────────────────────────────────────────────────┘
```

## 2. Monorepo Organization

- **`apps/mobile`**: Android-first React Native mobile application built on Expo SDK 58, Expo Router file-based routing, and TypeScript.
- **`apps/admin`**: Web management console built on Next.js 16 App Router, TypeScript, and Tailwind CSS v4.
- **`firebase/`**: Firestore database security rules (`firestore.rules`), composite query indexes (`firestore.indexes.json`), and emulator configuration (`firebase.json`).
- **`automation/n8n/`**: Production-ready automation workflow templates for order confirmations, technician dispatch, and periodic filter change alerts.
- **`docs/`**: Technical specifications, data models, and developer guides.

## 3. Brand & Visual Design System

The visual identity embodies **Purity, Minerals, and Technology**:
- **Primary Navy / Pure Blue (`#0077B6`, `#023E8A`)**: Evokes deep, filtered pure water.
- **Cyan & Flow (`#00B4D8`, `#E0F2FE`)**: Highlights active flow and purification stages.
- **Purity Health States**:
  - `Pristine (TDS 50-150 ppm)`: Emerald Green (`#10B981`)
  - `Acceptable (TDS 150-300 ppm)`: Pure Blue (`#3B82F6`)
  - `Warning / Filter Change Due (TDS 300-500 ppm)`: Amber (`#F59E0B`)
  - `Critical (TDS > 500 ppm)`: Crimson (`#EF4444`)
