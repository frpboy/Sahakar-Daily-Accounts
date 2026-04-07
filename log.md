# Sahakar Daily Accounts - Implementation Log

## Project Overview

**Project Name:** Sahakar Daily Accounts (DOAMS — Daily Outlet Account Management System)
**Tech Stack:** Next.js 16.2.2, PostgreSQL (Supabase), Drizzle ORM, Tailwind CSS, shadcn/ui, Supabase Auth
**Date Started:** 2026-04-01
**Last Updated:** 2026-04-07
**Production URL:** https://doams.vercel.app

---

## 2026-04-07 — Temporary Dev Login Profiles + Role-Aware Dashboard

**Dashboard routing (`src/app/dashboard/page.tsx`, `src/components/dashboards/OutletDashboardView.tsx`):**
- Fixed the role-blind dashboard route that was always rendering `AdminView`
- `admin` and `ho_accountant` still land on the consolidated admin dashboard
- `outlet_manager` and `outlet_accountant` now land on an outlet-scoped dashboard with relevant actions instead of seeing the admin dashboard

**Temporary dev login harness (`src/app/login/page.tsx`, `src/lib/dev-login-profiles.ts`, `src/app/api/dev-login/route.ts`):**
- Added a temporary test-account dropdown to the login page
- Selecting a profile pre-fills email and password and shows the intended role/outlet mapping
- On password sign-in, the selected dev profile is provisioned/synchronized into Supabase Auth and the app `users` table before login
- Added four hardcoded dev profiles for role testing:
  - `admin`
  - `ho_accountant`
  - `outlet_manager`
  - `outlet_accountant`
- Outlet-level test users are assigned to the first or second outlet in the DB at provisioning time

**Navigation (`src/components/shared/TopNav.tsx`):**
- `outlet_manager` now sees the Staff link, matching the current `/admin/users` scoped-access policy

## 2026-04-07 — User Provisioning, Report Pagination, IST Date Fix, Audit Cleanup

**User provisioning + RBAC (`src/lib/actions/users.ts`, `src/lib/permissions.ts`, `src/app/admin/users/page.tsx`, `src/components/admin/UsersList.tsx`, `src/components/forms/UserForm.tsx`):**
- Admin-created users are now provisioned in Supabase Auth first and then inserted into the app `users` table with the same ID
- User update and delete flows now keep Supabase Auth and app DB records in sync
- `ho_accountant` remains read-only for user visibility
- `outlet_manager` is now intentionally supported on `/admin/users` with scoped user management for `outlet_accountant` users in the manager's own outlet only
- Page-level guards, server actions, and docs were aligned to the same policy
- Registration approval remains admin-only and now creates a real Supabase Auth user before inserting the approved app user row

**Daily entry date handling (`src/lib/utils.ts`, `src/components/forms/DailyEntryForm.tsx`, `src/lib/actions/accounts.ts`, `src/app/entry/page.tsx`):**
- Replaced `toISOString().split("T")[0]` business-date handling with explicit `YYYY-MM-DD` parse/format helpers
- Entry edit prefill, duplicate-entry detection, and submit/update flows now preserve IST dates correctly

**Reports pagination (`src/app/api/all-reports/route.ts`, `src/app/api/own-reports/route.ts`, `src/app/reports/page.tsx`, `src/app/reports/own/page.tsx`):**
- Both report APIs now return `{ data, pagination }`
- Added `page`, `pageSize`, `total`, `totalPages`, `hasPreviousPage`, and `hasNextPage`
- UI pages now keep pagination state in the URL alongside existing filters
- CSV export now fetches the full filtered dataset with `includeAll=true` instead of exporting only the visible page or a silent server cap

**Outlet audit logging (`src/app/api/outlets/route.ts`, `src/lib/actions/audit.ts`):**
- Outlet creation now records the actual authenticated actor instead of the hardcoded string `Admin`
- Audit `newData` now writes structured objects directly for the `jsonb` column instead of pre-stringifying JSON
- `entityType` support expanded to include `outlet`

## 2026-04-07 — Deep Linking + Entry Edit Restrictions

**Daily account actions (`src/lib/actions/accounts.ts`):**
- `submitDailyAccount`: `outlet_manager` can no longer create or overwrite entries older than 31 days
- `deleteDailyAccount`: `outlet_manager` can delete only entries for their own outlet within 31 days; `admin` and `ho_accountant` remain unrestricted
- `getEntryByDateAndOutlet` added to support server-side entry lookup for edit prefill
- `getMyProfile` added to expose current user's role and assigned outlet for client-side gating

**Entry page + form (`src/app/entry/page.tsx`, `src/components/forms/DailyEntryForm.tsx`):**
- `/entry` now accepts `?date=` and `?outletId=` query params
- Existing daily account data is loaded server-side and passed into `DailyEntryForm` as `initialValues`
- Form fields prefill when editing an existing record instead of forcing manual re-entry

**Reports deep linking (`src/app/reports/page.tsx`, `src/app/reports/own/page.tsx`):**
- `/reports` now persists `outlet`, `from`, and `to` filters in the URL
- `/reports/own` now persists `from` and `to` filters in the URL
- Clear actions now reset both UI state and query params
- Own reports edit actions deep link into `/entry?date=...&outletId=...`

**Dashboard deep linking (`src/app/dashboard/page.tsx`, `src/components/dashboards/AdminView.tsx`, `src/components/shared/DateRangeFilter.tsx`):**
- Dashboard range filter now reads `from` and `to` from the URL
- Selecting a new range updates the URL without full navigation
- `DateRangeFilter` now syncs its visible label from the current query-backed range

**Role-based UI behavior:**
- `/reports/own`: entries older than 31 days show a lock icon for `outlet_manager`
- `/reports/own`: `ho_accountant` can still edit historical entries without the 31-day lock
- `/reports`: `admin` and `ho_accountant` can delete rows directly from the all-reports table

## 2026-04-07 — Next.js Proxy Cleanup + Sentry Integration

**Next.js 16 dev startup fix (`src/proxy.ts`, `src/middleware.ts`, `next.config.js`):**
- Removed duplicate `src/middleware.ts` so the app uses `src/proxy.ts` only
- This resolves the Next.js 16 startup error: "Both middleware file './src/middleware.ts' and proxy file './src/proxy.ts' are detected"
- Added `allowedDevOrigins: ["192.168.29.120"]` to `next.config.js` so LAN dev access can use Next.js dev resources without cross-origin blocking
- Proxy matcher now excludes `monitoring` so Sentry tunnel requests bypass auth redirects

**Sentry SDK setup (`@sentry/nextjs`):**
- Installed `@sentry/nextjs@^10.47.0`
- Added App Router Sentry files:
  - `instrumentation-client.ts`
  - `instrumentation.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`
  - `src/app/global-error.tsx`
- Enabled:
  - Error monitoring
  - Tracing
  - Session Replay
  - Sentry Logs
- Configured Sentry tunnel route at `/monitoring`
- Added `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to local environment config

**Sentry setup limits / follow-up:**
- Source map upload is not configured yet because `SENTRY_AUTH_TOKEN` / org / project values were not provided
- Production-grade source map upload should be added before relying on minified stack traces

## Current Routes

| Route                              | Type     | Description                        |
| ---------------------------------- | -------- | ---------------------------------- |
| `/`                                | Redirect | → `/admin/overview`                |
| `/login`                           | Static   | Supabase login (password/magic/forgot password) |
| `/register`                        | Static   | Request access form (no public signup) |
| `/admin/overview`                  | Static   | Admin dashboard                    |
| `/admin/users`                     | Static   | User management (admin), read-only user list (ho_accountant), outlet-scoped accountant management (outlet_manager) |
| `/dashboard`                       | Static   | Dashboard                          |
| `/entry`                           | Static   | Daily entry form                   |
| `/reports`                         | Static   | All outlets reports with deep-linked filters and pagination |
| `/reports/own`                     | Static   | Own outlet reports with deep-linked filters and pagination |
| `/outlets`                         | Static   | All outlets view                   |
| `/outlets/[id]`                    | Dynamic  | Single outlet detail               |
| `/accounts/chart-of-accounts`      | Static   | Chart of Accounts                  |
| `/admin/settings`                  | Static   | User settings (Profile, Change Password, Notifications) |
| `/update-password`                 | Static   | Set new password after reset link (public, accessible while authenticated) |

## API Routes

| Route                            | Method | Auth Required | Purpose                      |
| -------------------------------- | ------ | ------------- | ---------------------------- |
| `/api/auth/callback`             | GET    | No            | Supabase PKCE code exchange  |
| `/api/registration-requests`     | POST   | No            | Submit registration request  |
| `/api/dashboard-stats`           | GET    | Yes           | Dashboard statistics         |
| `/api/outlets-stats`             | GET    | Yes           | All outlets with stats       |
| `/api/outlets-list`              | GET    | Yes           | List all outlets             |
| `/api/outlets`                   | POST   | Yes           | Create new outlet            |
| `/api/all-reports`               | GET    | Yes           | Paginated all-reports API with filters and `includeAll` export mode |
| `/api/own-reports`               | GET    | Yes           | Paginated own-reports API with filters and `includeAll` export mode |
| `/api/notifications`             | GET    | Yes           | User notifications           |

---

## Authentication (Supabase Auth)

### Setup

- **Provider:** Supabase Auth (project: `grdeedwkzqyfxgfeskdr`)
- **SDK:** `@supabase/supabase-js` + `@supabase/ssr`
- **Middleware:** `src/proxy.ts` — Next.js 16 routing middleware (always Node.js; do NOT add `export const runtime`)
- **Public paths:** `/login`, `/register`, `/api/auth/callback`, `/update-password`
- **Auth-redirect paths** (authenticated users bounced to `/dashboard`): `/login`, `/register` only
- **Protected:** All other routes redirect to `/login` if no session

### Login Methods

- **Email + Password** — standard sign in
- **Magic Link** — passwordless OTP sent to email
- **Forgot Password** — sends reset link via `resetPasswordForEmail`, redirects to `/settings` after reset

### Registration Flow (No Public Signup)

1. User visits `/register` → submits name, email, phone, **password**
2. Record inserted into `registration_requests` table (status: `pending`, password stored)
3. **Admin only** reviews at `/admin/users` → Pending Requests section (ho_accountant cannot see or action this)
4. On approval: `supabase.auth.admin.createUser({ email, password, email_confirm: true })` — user can log in immediately, no invite email needed
5. User row created in `users` table with Supabase UUID as ID
6. Password cleared from `registration_requests` table after approval

### Auth Client Utilities

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | `createBrowserClient` for client components |
| `src/lib/supabase/server.ts` | `createServerClient` (async) for server actions/routes |
| `src/lib/supabase/middleware.ts` | `updateSession()` session cookie refresh |

### Server Action Pattern

```typescript
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return { error: "Unauthorized" };

const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
// dbUser.role, dbUser.outletId
```

### Admin User Setup (First-Time)

1. Go to Supabase Dashboard → Authentication → Users → "Create new user"
2. Email: `frpboy12@gmail.com`, set a password, tick "Auto Confirm"
3. Copy the generated UUID
4. Run in Supabase SQL Editor:
   ```sql
   UPDATE users SET id = '<UUID>' WHERE email = 'frpboy12@gmail.com';
   ```

---

## Database (Supabase PostgreSQL)

### Connection

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Transaction Pooler (port 6543) — used by app at runtime |
| `DIRECT_URL` | Direct connection (port 5432) — used by drizzle-kit migrations only |

**Host (Pooler):** `aws-1-ap-southeast-2.pooler.supabase.com:6543`
**Host (Direct):** `db.grdeedwkzqyfxgfeskdr.supabase.co:5432`

### Schema — Tables (12 total)

| Table | Description |
|-------|-------------|
| `outlets` | 14 retail outlets (7 locations × 2 business types) |
| `users` | User accounts — `id` is Supabase Auth UUID (text) |
| `daily_accounts` | Core financial entries (NUMERIC(12,2) for all monetary fields) |
| `account_categories` | COA Level 1: Asset, Liability, Equity, Revenue, Expense |
| `account_groups` | COA Level 2: sub-groups with self-referential hierarchy |
| `chart_of_accounts` | COA Level 3: individual accounts with codes |
| `audit_logs` | Action audit trail (JSONB old/new data) |
| `notifications` | User notifications |
| `registration_requests` | Pending user access requests — includes `password` column (cleared after approval) |
| `financial_years` | Financial year cycles with start/end dates and current flag |
| `system_preferences` | Global and per-outlet config key-value pairs |
| `submission_reminders` | Scheduled daily entry reminder times per outlet |

### Key Constraints

- `daily_accounts(outlet_id, date)` UNIQUE — one entry per outlet per day
- All monetary fields: `NUMERIC(12, 2)` — no floating-point errors
- `outlets → daily_accounts` CASCADE DELETE
- `users.id` = Supabase Auth UUID (text, not uuid type)

### Seed Data

- 14 outlets provisioned
- 420 daily entries (14 outlets × 30 days)
- Admin user: `frpboy12@gmail.com` (role: admin)
- 5 account categories, 5 groups, 7 chart of accounts entries

---

## User Roles (RBAC)

Roles are stored in the `users` DB table. Supabase Auth handles identity only.

| Role | Scope | Permissions |
|------|-------|-------------|
| `admin` | All outlets | Full CRUD, user management, all reports, accounts |
| `ho_accountant` | All outlets | Create/edit all entries, all reports, export, view users |
| `outlet_manager` | Assigned outlet only | Create/edit/delete own entries within 31 days, own reports, manage outlet accountants in own outlet |
| `outlet_accountant` | Assigned outlet only | Create/edit own entries, own reports |

Permission matrix: `src/lib/permissions.ts`

---

## Implemented Features

### 1. Daily Entry Form

- Date & Outlet selection
- Total Sales Amount input (red box with dynamic border color)
- Payment methods: Cash, UPI, Credit (3-column grid)
- Sales Return field (in Operations section, 4-column grid)
- Tally validation — checks if payment methods = total sales
- Toast notifications (Sonner) for match/mismatch
- Operations: Sales Return, Expenses, Purchase, Closing Stock
- IST timezone enforcement for dates
- INR currency formatting (₹)
- Server enforces outlet from session (prevents ID swapping for managers)

### 2. User Management

- Create/Edit/Delete users
- Role assignment: Admin, HO Accountant, Outlet Manager, Outlet Accountant
- Branch/Outlet assignment (required for outlet-level roles)
- Active/Inactive toggle
- Email uniqueness validation
- **Pending Requests** tab: Admin/HO Accountant can approve or reject registration requests

### 3. Registration Request Flow

- `/register` page (public — no auth required)
- Submits name, email, phone to `registration_requests` table
- Admin approves → Supabase invite email sent → user sets password
- `SUPABASE_SERVICE_ROLE_KEY` used server-side only for `admin.inviteUserByEmail()`

### 4. RBAC Permissions

| Feature                        | Admin | HO Acc      | Outlet Mgr | Outlet Acc |
| ------------------------------ | :---: | :---------: | :--------: | :--------: |
| View users list (Staff)        |  ✅   | ✅ read-only |     ❌     |     ❌     |
| Add / edit / delete users      |  ✅   |     ❌      |     ❌     |     ❌     |
| Approve / reject registrations |  ✅   |     ❌      |     ❌     |     ❌     |
| /admin/overview                |  ✅   |     ✅      |  redirect  |  redirect  |
| Chart of Accounts              |  ✅   |     ✅      |     ✅     |     ✅     |
| All Reports                    |  ✅   |     ✅      |     ❌     |     ❌     |
| Own Reports                    |  ✅   |     ✅      |     ✅     |     ✅     |
| All Outlets view               |  ✅   |     ✅      |     ❌     |     ❌     |
| New Entry (all outlets)        |  ✅   |     ✅      |     ❌     |     ❌     |
| New Entry (own outlet)         |  ✅   |     ✅      |     ✅     |     ✅     |

### 5. Reports

- All Reports: Filter by outlet, export CSV
- Own Reports: View own outlet data, export CSV
- Summary cards: Total Sales, Expenses, Net Profit
- Date range filtering

### 6. Outlets View

- Card grid of all outlets
- Stats per outlet: Sales, Expenses, Entries, Net Profit
- Create new outlet dialog
- Outlet detail pages

### 7. Navigation

- Geist Design System inspired navbar
- Section labels: Dashboard, Entries, Reports, Outlets, Accounts, Staff
- Active state highlighting with `pathname.startsWith()`
- User dropdown with Supabase user info (name/email from auth session)
- Sign out via `supabase.auth.signOut()` → redirect `/login`
- Mobile responsive hamburger menu

### 8. UI/UX

- Inter font family
- Geist Design System color palette (10-step gray scale)
- No italics enforced globally
- Toast notifications (Sonner) for form feedback
- Dark mode CSS variables defined

---

## Components

| Component               | Path                                           | Purpose                                     |
| ----------------------- | ---------------------------------------------- | ------------------------------------------- |
| TopNav                  | `components/shared/TopNav.tsx`                 | Navigation with Supabase user               |
| ClientLayout            | `components/shared/ClientLayout.tsx`           | Root layout wrapper + PWAPrompt mount       |
| PWAPrompt               | `components/shared/PWAPrompt.tsx`              | PWA install banner + notification permission banner |
| DailyEntryForm          | `components/forms/DailyEntryForm.tsx`          | Entry form with tally + overwrite detection |
| UserForm                | `components/forms/UserForm.tsx`                | User CRUD form                              |
| UsersList               | `components/admin/UsersList.tsx`               | User list with inline edit/delete           |
| RegistrationRequestsList| `components/admin/RegistrationRequestsList.tsx`| Pending registration approvals              |
| AccountsDataTable       | `components/tables/AccountsDataTable.tsx`      | Reports table                               |
| PersonalProfile         | `components/settings/SettingsPages.tsx`        | Profile form with outlet card for outlet users |
| SecuritySettings        | `components/settings/SettingsPages.tsx`        | Change password form                        |
| NotificationSettings    | `components/settings/NotificationSettings.tsx` | Notification permission management          |

### UI Components (shadcn/ui)

button, input, select, card, form, label, table, container, badge, switch, avatar, dropdown-menu, dialog

---

## Key Files

| File                                    | Purpose                              |
| --------------------------------------- | ------------------------------------ |
| `src/proxy.ts`                          | Route protection + session refresh (Next.js 16 middleware) |
| `src/lib/actions/audit.ts`             | `logAudit()` helper → writes to `audit_logs` table |
| `src/types/supabase.ts`                | Generated Supabase TypeScript types  |
| `src/lib/supabase/client.ts`            | Browser Supabase client              |
| `src/lib/supabase/server.ts`            | Server Supabase client (async)       |
| `src/db/schema.ts`                      | Drizzle schema (12 tables)           |
| `src/db/index.ts`                       | postgres.js + Drizzle client         |
| `src/db/seed.ts`                        | Database seeding script              |
| `drizzle.config.ts`                     | Drizzle config (uses DIRECT_URL)     |
| `src/lib/permissions.ts`               | RBAC permission matrix               |
| `src/lib/actions/accounts.ts`          | Daily account server actions + audit logging |
| `src/lib/actions/users.ts`             | User CRUD actions + audit logging    |
| `src/lib/actions/registrations.ts`     | Registration request actions (createUser on approve) |
| `src/lib/actions/coa.ts`               | Chart of Accounts actions            |
| `src/lib/validations/entry.ts`         | Zod validation schemas               |
| `src/lib/export.ts`                    | jsPDF export — A4 landscape PDF from table DOM |
| `src/app/login/page.tsx`               | Login page (password / magic link / forgot password) |
| `src/app/register/page.tsx`            | Registration request page (with password field) |
| `src/app/api/auth/callback/route.ts`   | Supabase PKCE callback handler       |
| `src/app/api/registration-requests/route.ts` | Public registration POST endpoint |
| `public/sw.js`                          | Service worker — push event handler + notification click |
| `public/manifest.json`                  | PWA manifest (icons, start_url, display: standalone) |

---

## Environment Variables

```env
# Supabase Database — Transaction Pooler (runtime)
DATABASE_URL=postgresql://postgres.grdeedwkzqyfxgfeskdr:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres

# Supabase Database — Direct connection (drizzle-kit migrations only)
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.grdeedwkzqyfxgfeskdr.supabase.co:5432/postgres

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://grdeedwkzqyfxgfeskdr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  (public — safe for client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...       (secret — server only, never expose)
```

---

## Commands

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run db:push      # Push Drizzle schema to Supabase (uses DIRECT_URL)
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database (14 outlets, 420 entries)
npm run format       # Prettier format
```

---

## Deployment

- **Platform:** Vercel
- **Production URL:** https://doams.vercel.app
- **Build Status:** ✅ Successful
- **TypeScript:** ✅ Zero errors

### Vercel Environment Variables to Set

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Transaction Pooler URL (port 6543) |
| `DIRECT_URL` | Direct connection URL (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://grdeedwkzqyfxgfeskdr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role secret key |

---

## Migration History

### 2026-04-04 — Rupee Symbol Rendering Fix in PDF Export (Session 5c)

**Problem:** PDF exports showed `¹1,000.00` — the `₹` glyph (U+20B9) is not included in jsPDF's built-in Helvetica font and renders as the character "1".

**Root cause:** `exportToPDF` in `src/lib/export.ts` was passing `html: table` directly to `jspdf-autotable`, which reads raw DOM text including the `₹` character. jsPDF cannot render it.

**Fix (`src/lib/export.ts`):**
- Replaced `html: table` with manual DOM extraction using `querySelectorAll`
- All cell text values have `₹` replaced with `Rs.` before passing to autoTable
- Headers extracted from `thead th`, rows from `tbody td`
- Passes `head: [headers], body: rows` instead of `html: table`

---

### 2026-04-04 — Rupee Symbol Rendering Fix in HTML (Session 5b)

**Problem:** Currency values across all tables and KPI cards showed a floating superscript "1" above each number.

**Root cause:** `font-mono` forces a monospace font family (Consolas/Courier). The `₹` symbol is not in most monospace fonts — the browser falls back to a different font just for that character, rendering it at the wrong baseline/size, visually appearing as a "1" floating above the number.

**Fix:** Replaced `font-mono` with `tabular-nums` (`font-variant-numeric: tabular-nums`) in all currency display contexts. `tabular-nums` gives equal-width digits for column alignment without changing the font family, so `₹` renders correctly from the UI font.

**Files changed:** `reports/page.tsx`, `reports/own/page.tsx`, `admin/overview/page.tsx`, `outlets/page.tsx`, `outlets/[id]/page.tsx`, `AdminView.tsx`, `DailyEntryForm.tsx`

**Non-currency `font-mono` left unchanged:** email addresses, outlet codes, audit log timestamps, account codes.

---

### 2026-04-04 — Boneyard-JS Pixel-Perfect Skeleton Screens (Session 5a)

**Integrated `boneyard-js` for pixel-perfect loading skeletons:**
- Replaced manual `animate-pulse` rows in reports table with `<Skeleton name="reports-table">`
- Wrapped dashboard KPI grid with `<Skeleton name="dashboard-kpis">`
- Wrapped outlet submission tracker grid with `<Skeleton name="dashboard-outlets">`
- Each skeleton has `fixture` (realistic mock data for CLI capture) and `fallback` (animate-pulse for pre-capture graceful degradation)
- Created `src/bones/registry.js` (generated by `npx boneyard-js build`, imported in `ClientLayout`)

**Capture step (run whenever component layout changes):**
```bash
# 1. Temporarily add /dashboard and /reports to PUBLIC_PATHS in proxy.ts
# 2. With dev server running:
npx boneyard-js build http://localhost:3000/dashboard http://localhost:3000/reports
# 3. Revert proxy.ts
```

**Captured bones (6 responsive breakpoints: 375–1536px):**
- `dashboard-kpis.bones.json` — 20 bones
- `dashboard-outlets.bones.json` — 70 bones
- `reports-table.bones.json` — 7 bones

---

### 2026-04-03 — RBAC Enforcement: Admin vs HO Accountant (Session 4c)

**Problem:** Admin and HO Accountant had identical access everywhere despite having different permissions in `permissions.ts`. Nothing enforced the distinction.

**Correct role boundaries enforced:**

| Capability | Admin | HO Accountant | Outlet roles |
|---|:---:|:---:|:---:|
| View users list | ✅ | ✅ | outlet_manager only |
| Add/edit/delete users | ✅ | ❌ | outlet_manager for own outlet accountants only |
| Approve/reject registrations | ✅ | ❌ | ❌ |
| Staff nav link visible | ✅ | ✅ | outlet_manager only |
| /admin/overview | ✅ | ✅ | redirect |
| /admin/users | ✅ | read-only | outlet_manager scoped access |

**`src/lib/actions/registrations.ts`:**
- `approveRegistrationRequest`: changed from `["admin","ho_accountant"]` → `admin` only
- `rejectRegistrationRequest`: same change

**`src/lib/actions/users.ts`:**
- Superseded by the 2026-04-07 RBAC refactor
- Current behavior: `admin` has full user management, `ho_accountant` is read-only, `outlet_manager` can manage `outlet_accountant` users in the manager's own outlet

**`src/app/admin/users/page.tsx`:**
- Superseded by the 2026-04-07 RBAC refactor
- Current behavior: `outlet_manager` can access the page, but only for users in the assigned outlet and only for `outlet_accountant` management
- Pending Registrations section remains admin-only

**`src/components/admin/UsersList.tsx`:**
- Superseded by the 2026-04-07 RBAC refactor
- Current behavior is role-aware and outlet-aware rather than a simple `isAdmin` toggle

**`src/components/shared/TopNav.tsx`:**
- Superseded by the 2026-04-07 RBAC refactor
- Current behavior: `admin`, `ho_accountant`, and `outlet_manager` all see the Staff link

**`src/app/admin/overview/page.tsx`:**
- Added server-side role check
- Outlet-level roles → `redirect("/dashboard")`

### 2026-04-03 — Forgot Password Flow Fix (Session 4b)

**Root cause (two bugs):**
1. `resetPasswordForEmail` redirectTo pointed to `/settings` — that route does not exist (correct route is `/admin/settings`)
2. `/admin/settings` just opens the Profile tab with no forced "enter new password" UI
3. `proxy.ts` `isPublic` check was shared with `isAuthRedirect` — authenticated users landing on `/update-password` after the reset callback were immediately bounced to `/dashboard` before they could set their password

**Fix — dedicated `/update-password` page (`src/app/update-password/page.tsx`):**
- Public route (no auth required, but also safe when authenticated)
- Shows "Set New Password" form: new password + confirm password fields
- Calls `supabase.auth.updateUser({ password })` on submit
- Validates: passwords match + minimum 6 characters
- On success: toast + redirect to `/dashboard` after 1.5s

**Fix — login page (`src/app/login/page.tsx`):**
- Changed `redirectTo` from `?next=/settings` → `?next=/update-password`

**Fix — proxy.ts (`src/proxy.ts`):**
- Split `PUBLIC_PATHS` into two separate arrays:
  - `PUBLIC_PATHS` — all routes accessible without auth (includes `/update-password`)
  - `AUTH_REDIRECT_PATHS` — routes that redirect authenticated users to dashboard (`/login`, `/register` only)
- `/update-password` is now accessible whether the user is authenticated or not
- Note: `proxy.ts` always runs on Node.js — `export const runtime` is NOT allowed and causes a build error if added

### 2026-04-03 — PWA, Push Notifications & UX Improvements (Session 4)

**PWA installation prompt (`src/components/shared/PWAPrompt.tsx`):**
- Listens for `beforeinstallprompt` event (triggered by Chrome/Edge when installable)
- Shows bottom banner: "Install DOAMS — Add to home screen for quick access" with Install / dismiss buttons
- Mounted in `ClientLayout` for all authenticated pages

**Push notification support:**
- `public/sw.js`: new service worker — registers on load, handles `push` events (shows notification with icon), handles `notificationclick` (focuses/opens app window)
- `public/manifest.json` linked in `layout.tsx` via `metadata.manifest`
- `PWAPrompt` shows "Enable notifications" banner on first visit if permission is `default`
- Requests `Notification.requestPermission()` on user click; registers service worker on grant

**Notification Settings tab (`src/components/settings/NotificationSettings.tsx`):**
- New "Notifications" sidebar tab added to `/admin/settings`
- Shows permission state: enabled (green), blocked (red with browser instructions), not supported, or prompt
- "Enable Notifications" button requests permission + registers SW
- "Send test" button fires a local notification to verify everything works
- Service worker registration status indicator

**Outlet display fix (`src/components/settings/SettingsPages.tsx`):**
- Outlet card for outlet-level users was using `text-[8px]` / `text-[9px]` (nearly invisible)
- Replaced with a prominent green card: outlet name in `text-2xl font-bold`, labelled "Your Assigned Outlet" with emerald background
- Shows outlet type and code as secondary info; "Contact admin to change" note

**DB migration:**
```sql
ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS password TEXT;
```

### 2026-04-03 — Cleanup, Error Boundaries, Loading Skeletons & Inline User Edit (Session 3)

**Cleanup:**
- Deleted `/app/test/page.tsx` — dev test route removed
- Removed `react-router-dom` dependency (unused in Next.js App Router project)
- Added error boundaries: `src/app/entry/error.tsx`, `src/app/reports/error.tsx`

**Report loading skeleton (`src/app/reports/page.tsx`):**
- Replaced spinner with 6-row animated skeleton (`animate-pulse`) matching table column count
- Prevents layout shift during data load

**Daily entry overwrite detection (`src/components/forms/DailyEntryForm.tsx`):**
- Detects if an entry already exists for the selected date + outlet via `/api/all-reports`
- Shows amber warning banner: "An entry already exists for this date"
- Submit button disabled until user clicks "Yes, overwrite" confirmation button
- `overwriteConfirmed` resets when date or outlet changes

**Inline user editing (`src/components/admin/UsersList.tsx`):**
- New `UsersList` client component with per-row pencil/trash icons
- Pencil toggles an inline `UserForm` pre-filled with user data (role, outlet, name, active status)
- `onSuccess`: closes inline form + `router.refresh()`
- Delete disabled for admin role; loading state during delete
- `src/app/admin/users/page.tsx` updated to use `UsersList` instead of static list

### 2026-04-03 — Auth UX, Settings Simplification & Registration Password Flow

**Login page (`src/app/login/page.tsx`):**
- Removed Google OAuth sign-in button (no credentials configured)
- Added Forgot Password mode — "Forgot password?" link next to password field; sends reset link via `supabase.auth.resetPasswordForEmail`, redirects to `/settings` after reset
- Description changed from "Enterprise Grade Daily Account Management" to "Daily outlet accounts — Sahakar Group"
- Loading text changed from "Authenticating..." to "Signing in..."
- Commit: `a2761f4`

**Registration flow (password support):**
- `src/db/schema.ts`: added `password` column to `registration_requests` table (pushed via `db:push`)
- `src/app/register/page.tsx`: added password field (`required`, `minLength=6`); footer simplified to "Powered by Sahakar Group IT"
- `src/app/api/registration-requests/route.ts`: forwards `password` from request body to action
- `src/lib/actions/registrations.ts`:
  - `submitRegistrationRequest` now accepts and stores `password`
  - `approveRegistrationRequest` replaced `inviteUserByEmail` with `admin.createUser({ email, password, email_confirm: true })` — user can log in immediately after admin approval, no invite email needed
  - Password is cleared from `registration_requests` table after approval
- Commit: `98fd2a0`

**Settings page cleanup (`src/app/admin/settings/page.tsx`):**
- Stripped to 2 sections only: **Profile** (name/phone) and **Change Password**
- Removed: Sessions, Appearance, User Management, Outlets, Financial Year, Reporting Rules, Audit Trail, Reminders, Verification Rules, Default Values, Local Sync, Danger Zone
- Title changed from "Configuration Portal" to "Settings"; removed "System Runtime 2.4.0" tag, background watermark, "Secure Sync Active" dot
- Removed all unused state and fetch queries
- Commit: `88168a3`

**Settings labels (`src/components/settings/SettingsPages.tsx`):**
- All jargon labels replaced with plain English: "Identity Management Hub" → "Your Profile", "Mobile Terminal Pointer" → "Phone Number", "Master Authentication Email" → "Email Address", "Push Identity Changes" → "Save Changes", etc.
- Removed non-functional "Emergency Terminal Lockdown" section from SecuritySettings
- Toast error "PASSWORD MISMATCH" → "Passwords do not match"
- Commit: `88168a3`

**Supabase TypeScript types (`src/types/supabase.ts`):**
- Re-generated from live database using `npx supabase gen types typescript --project-id grdeedwkzqyfxgfeskdr` after logging in with project owner account
- Replaces hand-written placeholder — now includes `password` column on `registration_requests` and all other live schema changes

### 2026-04-03 — Security, Auth & PDF Hardening

**Root middleware (`src/middleware.ts`):**
- Replaced missing root middleware — previously there was no request-level route guard
- `src/middleware.ts` now imports `updateSession()` from `src/lib/supabase/middleware.ts`
- Unauthenticated requests to protected routes → redirect `/login`
- Authenticated users accessing `/login` or `/register` → redirect `/dashboard`
- Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, and all image extensions
- Commit: `8714db9`

**Supabase TypeScript types (`src/types/supabase.ts`):**
- Generated from live Supabase project `grdeedwkzqyfxgfeskdr` using Supabase CLI
- File was previously empty (0 bytes); now contains full `Database`, `Tables`, `Enums` types

**Entry page permission fix (`src/app/entry/page.tsx`):**
- Removed hardcoded `const canSeeAllOutlets = true` that gave every user admin-level outlet access
- Converted from client component to server component
- Now reads real Supabase user → DB user → derives `canSeeAllOutlets` via `canAccessAllOutlets(role)` from `src/lib/permissions.ts`
- Outlet-level users (outlet_manager, outlet_accountant) see only their assigned outlet; no outlet selector abuse possible
- Outlet-level users with no outletId get a clear error message

**Audit logging (`src/lib/actions/audit.ts` + wired into `accounts.ts` and `users.ts`):**
- New `logAudit()` helper writes to `audit_logs` table (schema was already in place, writes were missing)
- Captures: userId, userName, action, entityType, entityId, oldData (JSONB), newData (JSONB)
- Never throws — failures are logged to console only, never break the calling action
- Wired into `submitDailyAccount`: logs `create` or `update` (detects by pre-query before upsert)
- Wired into `createUser`, `updateUser`, `deleteUser`, `approveRequest`, `rejectRequest`

**Production PDF export (`src/lib/export.ts`):**
- Replaced browser `window.open()` + `window.print()` with `jspdf` + `jspdf-autotable`
- Dynamic import (`await import(...)`) prevents SSR issues
- Reads `<table>` element from DOM via `elementId`, produces styled A4 landscape PDF
- Downloads as `<filename>.pdf` directly — no print dialog
- Installed: `jspdf`, `jspdf-autotable`

### 2026-04-02 — Neon → Supabase + Kinde → Supabase Auth

**Database migration:**
- Removed `@neondatabase/serverless`, installed `postgres@3.4.8`
- `src/db/index.ts`: switched to `drizzle-orm/postgres-js` with `prepare: false` (required for PgBouncer transaction mode)
- `drizzle.config.ts`: now uses `DIRECT_URL` for schema push/generate (bypasses PgBouncer)
- `package.json`: updated `db:push` and `db:generate` scripts to remove deprecated `:pg` suffix
- All 9 tables pushed to Supabase, 420 seed entries created

**Auth migration:**
- Removed `@kinde-oss/kinde-auth-nextjs`
- Installed `@supabase/supabase-js@2.101.1` + `@supabase/ssr@0.10.0`
- Created `src/lib/supabase/` with `client.ts`, `server.ts`, `middleware.ts`
- `middleware.ts` (root): Vercel Routing Middleware with `export default`, Node.js runtime — handles session refresh + redirect to `/login`
- `/login` page: replaced Kinde buttons with email+password form, magic link toggle, Google OAuth button
- `/register` page: new public registration request form
- `/api/auth/callback`: Supabase PKCE code exchange (replaces `/api/auth/[kindeAuth]`)
- Added `registration_requests` table to schema
- `src/lib/actions/registrations.ts`: submit, approve (with invite email), reject actions
- `src/app/api/registration-requests/route.ts`: public POST endpoint for `/register` page
- `src/lib/actions/accounts.ts`: replaced hardcoded user stub with real Supabase session
- `src/components/shared/TopNav.tsx`: Supabase user info + `signOut()`
- `src/app/layout.tsx`: removed KindeProvider/AuthProvider wrapper
- Deleted: `src/app/AuthProvider.tsx`, `src/app/api/auth/[kindeAuth]/route.ts`

### 2026-04-02 — Fix: Proxy matcher blocking Turbopack static chunks

**Root cause:** `src/proxy.ts` `proxyConfig.matcher` excluded `_next/static` (Webpack production paths) but NOT `_next/dev/` (Turbopack dev paths). In dev mode, all JS/CSS chunks are served from `/_next/dev/static/chunks/`. Unauthenticated requests to these paths were intercepted by the proxy and redirected to `/login`, returning HTML instead of JavaScript/CSS. This caused 21 "Unexpected token '<'" console errors and completely unstyled pages on all routes.

**Fix:**
- `src/proxy.ts`: changed matcher from `_next/static|_next/image` → `_next/` to exclude ALL Next.js internal paths
- `src/proxy.ts`: added `export const runtime = "nodejs"` (Next.js 16 Node.js runtime declaration)

**Before:**
```
"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
```
**After:**
```
"/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
```

---

## Pending / Next Steps

- [ ] **Google OAuth:** Removed for now — re-add when Google Cloud credentials are available
- [ ] **Brevo sender domain:** Replace `frpboy12@gmail.com` sender with a custom domain to pass SPF/DKIM/DMARC and avoid spam filtering
- [ ] **Server-side push:** Implement VAPID key generation + push subscription endpoint + push from server (e.g. missed entry reminder cron) — currently only local notifications are possible
- [ ] **Chart of Accounts UI:** Complete CRUD pages (schema done, UI partial)
- [ ] **Advanced analytics:** Trend charts, month-over-month comparisons
- [ ] **Email notifications:** Alert admin when daily entry is missed

---

## Email (Brevo SMTP)

- **Provider:** Brevo (formerly Sendinblue) — free tier, 300 emails/day
- **SMTP host:** `smtp-relay.brevo.com`, port `587`, TLS
- **Configured in:** Supabase Dashboard → Settings → Auth → SMTP
- **SMTP login:** `a70a1b001@smtp-brevo.com` (Brevo SMTP username — NOT the sender address)
- **Sender email:** `frpboy12@gmail.com` (verified in Brevo sender list)
- **Handles:** Password reset emails, magic link emails
- **Note:** Using Gmail as sender may hit DMARC checks — long-term fix is a custom domain

---

## Notes

- All routes protected except `/login`, `/register`, `/api/auth/callback`
- Seed data: 30 days of dummy financial data for all 14 outlets (420 entries)
- All monetary values: `NUMERIC(12,2)` — no floating-point errors
- All dates/times: IST (UTC+5:30)
- All currency: INR (₹) format
- Server actions enforce outlet from session — managers cannot submit for other outlets
- `SUPABASE_SERVICE_ROLE_KEY` is used ONLY in server actions, never exposed to client
- `src/proxy.ts` handles session refresh + auth redirect (Next.js 16 proxy — matcher excludes all `_next/` and API paths)
- PWA: manifest linked, service worker at `/sw.js`, install prompt via `beforeinstallprompt`
- Push notifications: permission-gated, local notifications work immediately; server push requires VAPID setup
