# Calinfco Water Purifiers - E-Commerce & Service Operations Monorepo

Welcome to the **Calinfco Water Purifier** platform repository. This project powers an end-to-end water purifier e-commerce storefront, water TDS quality monitoring, doorstep technician booking, and operations control center.

---

## 🏗️ Repository Structure

```
├── apps/
│   ├── mobile/             # Android-first React Native Expo app (TypeScript, Expo Router)
│   └── admin/              # Operations console in Next.js 16 (TypeScript, Tailwind CSS)
├── firebase/
│   ├── firestore.rules     # Role-based Firestore security rules
│   ├── firestore.indexes.json # Composite database indexes
│   └── firebase.json       # Emulator configuration (Ports 8080, 9099, 4000)
├── automation/
│   └── n8n/
│       ├── workflows/      # Sample workflows (Orders, Service Dispatch, Filter Alerts)
│       └── README.md       # n8n import & trigger instructions
├── docs/
│   ├── ARCHITECTURE.md     # High-level architecture & system diagrams
│   ├── DATA_MODEL.md       # Firestore schema & TypeScript entity models
│   ├── API_SPEC.md         # n8n webhooks and Admin API specs
│   └── SETUP_GUIDE.md      # Detailed developer setup instructions
├── .env.example            # Root sample environment variables (No secrets!)
├── .gitignore              # Multi-project ignore configuration
├── package.json            # Monorepo task orchestration
├── PROJECT_RULES.md        # Core engineering, security, and design standards
└── README.md               # Main project guide
```

---

## ⚡ Quick Start

### 1. Run the Admin Console (`apps/admin`)
```bash
cd apps/admin
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

Routes:
- `/` - Operations Overview & KPIs
- `/purifiers` - Purifier & Replacement Filter Catalog
- `/orders` - Orders & Doorstep Installations
- `/services` - Field Technician Requests & Water TDS Tickets
- `/customers` - Customer Directory & AMC Contracts

### 2. Run the Mobile Application (`apps/mobile`)
```bash
cd apps/mobile
npm start
# Press 'a' in terminal to open Android emulator
# Or run 'npm run web' for quick web preview
```

Tabs & Screens:
- **Home**: Live Tap Water Quality Monitor (TDS & pH), Brand Flagship Showcase, Quick Service Actions.
- **Catalog**: Purifiers (RO+UV+UF+Alkaline), Sediment/Carbon Filter cartridges, AMC Plans.
- **Services**: Book Doorstep Water TDS Analysis or Technician Installation.

---

## 🛡️ Security & Zero-Secret Guarantee

- Real secrets, private keys, service account JSON files, and production credentials **must never be committed**.
- All environment configurations are templated in `.env.example` files.
- Firestore security rules restrict write access to authenticated admins and customers for their respective records.

---

## 🧪 Project Checks

```bash
# Build the admin application
npm run build:admin

# Run linter
npm run lint:admin
```
