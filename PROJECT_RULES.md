# Calinfco Water Purifier E-Commerce - Project Rules & Engineering Standards

## 1. Security & Secrets Management (Zero Leaks Policy)
- **NEVER hardcode or commit real credentials**, service account JSONs, private keys, JWT secrets, database connection strings, or production API keys to git.
- All secrets must be loaded via `.env` or `.env.local` files, with sample keys documented exclusively in `.env.example`.
- All Firestore access rules must enforce authenticated user role checks (`customer`, `admin`, `technician`).

## 2. Monorepo Architecture & Independent Runnability
- `apps/mobile` (Expo React Native) and `apps/admin` (Next.js) **MUST remain independently runnable**.
- Developers must be able to `cd apps/mobile && npm start` or `cd apps/admin && npm run dev` without workspace coupling errors.
- Never tightly couple Expo-specific native runtime libraries inside Next.js or vice versa.

## 3. Brand & Visual Design Standards
- Calinfco's brand visual identity is based on **Pure Water & Crystal Minerals**:
  - Primary Water Blue: `#0077B6`
  - Deep Ocean: `#023E8A`
  - Flow Cyan: `#00B4D8`
  - Pristine Water TDS (50-150 ppm): `#10B981`
  - Alert / Filter Due: `#F59E0B`
  - Critical / Unsafe TDS: `#EF4444`
- Mobile styling must support smooth light and dark mode switching via `useTheme()` tokens.
- Admin styling must utilize modern dark-mode responsive layouts with Tailwind CSS.

## 4. Code Standards & TypeScript
- Strict TypeScript must be maintained across all packages (`noImplicitAny`, proper return types).
- Component-driven architecture: keep presentation and business logic clean and modular.
- Do not bypass lint errors with `any` casts or unverified suppressions.

## 5. Automation & Integration Rules (n8n & Firebase)
- All automations must fail gracefully and log webhook payloads for auditability.
- Service dispatch payloads must validate postal codes and technician availability before confirmation.
- Filter reminder cron jobs must run non-disruptively during standard customer communication hours (09:00 - 19:00 IST).

## 6. Git & Branching Hygiene
- Commit messages should follow conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Pull Requests must pass Next.js production build (`npm run build:admin`) and Expo route verification.
