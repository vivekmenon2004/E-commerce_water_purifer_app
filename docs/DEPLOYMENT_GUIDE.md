# Calinfco Operations Portal — Vercel & Production Deployment Guide

This guide details the deployment procedure for the **Calinfco Operations & Admin Portal** (`apps/admin`) to **Vercel** and production cloud environments, including environment variables, zero-trust security configuration, and manual steps.

---

## 1. Monorepo Structure & Architecture
The repository is structured as an independently runnable monorepo:
- `apps/admin/` — Next.js 16.4.3 App Router web dashboard with Tailwind CSS.
- `apps/mobile/` — Expo React Native mobile customer application.
- `firebase/` — Strict Firestore security rules (`firestore.rules`) and index definitions.
- `data/` — Authoritative seed catalog (`seed-products.json`).

---

## 2. Deploying to Vercel

### Option A: Via Vercel Web Dashboard (Recommended)
1. **Import Git Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Select your Git provider (GitHub / GitLab / Bitbucket) and import `E-commerce_water_purifer_app`.
2. **Configure Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click `Edit` and select `apps/admin`.
   - **Build Command**: `npm run build` (or leave default Next.js build)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
3. **Environment Variables**:
   Configure the production variables in the Vercel project settings (see Section 3 below).
4. **Deploy**:
   Click **Deploy**. Vercel will build and assign a secure production URL (`calinfco-admin.vercel.app`).

### Option B: Via Vercel CLI
```bash
# Navigate to admin app directory
cd apps/admin

# Install Vercel CLI globally if not already installed
npm install -g vercel

# Link and deploy preview
vercel

# Deploy to production
vercel --prod
```

---

## 3. Environment Variables Reference

Configure the following environment variables in **Vercel Project Settings > Environment Variables**:

| Variable Name | Required | Description | Example / Target |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes (in Prod) | Firebase Web API key for auth & client Firestore | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes (in Prod) | Firebase Auth Domain | `calinfco-water-purifier.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes (in Prod) | Google Cloud / Firebase Project ID | `calinfco-water-purifier` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes (in Prod) | Firebase Storage bucket for product media | `calinfco-water-purifier.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes (in Prod) | Firebase FCM Sender ID | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes (in Prod) | Firebase Web App ID | `1:123456789012:web:abcdef` |
| `FIREBASE_CLIENT_EMAIL` | Optional / Server | Service account email for privileged operations | `firebase-adminsdk-xxx@...` |
| `FIREBASE_PRIVATE_KEY` | Optional / Server | Service account private key (encoded with newlines) | `-----BEGIN PRIVATE KEY-----\n...` |
| `RAZORPAY_KEY_ID` | Yes | Razorpay key ID for payment initiation | `rzp_live_...` or `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Yes (Server) | Secret key for HMAC signature verification | Protected secret (never expose to client) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | Public key ID accessible to client checkout | `rzp_test_...` |
| `N8N_WEBHOOK_URL` | Optional | Webhook endpoint for automated technician dispatch | `https://n8n.calinfco.com/webhook/...` |

> [!IMPORTANT]
> **Demo Mode Fallback**: If `NEXT_PUBLIC_FIREBASE_API_KEY` is omitted or contains sample placeholder text, the admin portal automatically operates in **Demo Mode**, displaying mock orders, products, and dealer applications without failing the build.

---

## 4. Security & Zero-Trust Verification Checklist

1. **Zero Leaks Policy**:
   - Private environment files (`.env`, `.env.local`, `.env.*.local`) and service account private keys (`service-account*.json`) are strictly excluded in `.gitignore`.
   - Never commit API secrets or private keys to version control.
2. **Server-Side Authorization**:
   - Role privileges (`admin`, `dealer`, `customer`) are strictly validated on trusted server endpoints (`/api/checkout/validate` and `/api/checkout/create-order`).
   - Client prices or roles sent in request payloads are **never trusted**; the server queries authoritative database records.
3. **No Public Admin Self-Registration**:
   - The `/login` portal disables public self-registration.
   - Admin access requires existing administrator documents in Firestore (`role: 'admin'`) or provisioned via Google Cloud CLI / `scripts/provision-admin.mjs`.
4. **Strict Firestore Security Rules**:
   - Rules in `firebase/firestore.rules` prohibit customers from modifying their own roles or self-approving dealer wholesale tiers.
   - Deploy security rules with:
     ```bash
     firebase deploy --only firestore:rules
     ```

---

## 5. Verification Commands

Run locally before submitting or deploying:

```bash
# 1. Run ESLint checks across admin portal
npm run lint:admin

# 2. Run Next.js production build
npm run build:admin

# 3. Run full automated integration test suite
npm run test:milestone
```
