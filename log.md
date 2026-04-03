# Sahakar Daily Accounts - Implementation Log

## Project Overview

**Project Name:** Sahakar Daily Accounts (DOAMS — Daily Outlet Account Management System)
**Tech Stack:** Next.js 16.2.2, PostgreSQL (Supabase), Drizzle ORM, Tailwind CSS, shadcn/ui, Supabase Auth
**Date Started:** 2026-04-01
**Last Updated:** 2026-04-03
**Production URL:** https://doams.vercel.app

---

## Current Routes

| Route                              | Type     | Description                        |
| ---------------------------------- | -------- | ---------------------------------- |
| `/`                                | Redirect | → `/admin/overview`                |
| `/login`                           | Static   | Supabase login (password/magic/Google) |
| `/register`                        | Static   | Request access form (no public signup) |
| `/admin/overview`                  | Static   | Admin dashboard                    |
| `/admin/users`                     | Static   | User management + pending requests |
| `/dashboard`                       | Static   | Dashboard                          |
| `/entry`                           | Static   | Daily entry form                   |
| `/reports`                         | Static   | All outlets reports                |
| `/reports/own`                     | Static   | Own outlet reports                 |
| `/outlets`                         | Static   | All outlets view                   |
| `/outlets/[id]`                    | Dynamic  | Single outlet detail               |
| `/accounts/chart-of-accounts`      | Static   | Chart of Accounts                  |
| `/test`                            | Static   | Test page                          |

## API Routes

| Route                            | Method | Auth Required | Purpose                      |
| -------------------------------- | ------ | ------------- | ---------------------------- |
| `/api/auth/callback`             | GET    | No            | Supabase PKCE code exchange  |
| `/api/registration-requests`     | POST   | No            | Submit registration request  |
| `/api/dashboard-stats`           | GET    | Yes           | Dashboard statistics         |
| `/api/outlets-stats`             | GET    | Yes           | All outlets with stats       |
| `/api/outlets-list`              | GET    | Yes           | List all outlets             |
| `/api/outlets`                   | POST   | Yes           | Create new outlet            |
| `/api/all-reports`               | GET    | Yes           | All reports with filters     |
| `/api/own-reports`               | GET    | Yes           | Own outlet reports           |
| `/api/notifications`             | GET    | Yes           | User notifications           |

---

## Authentication (Supabase Auth)

### Setup

- **Provider:** Supabase Auth (project: `grdeedwkzqyfxgfeskdr`)
- **SDK:** `@supabase/supabase-js` + `@supabase/ssr`
- **Middleware:** `middleware.ts` (root) — Vercel Routing Middleware with Node.js runtime
- **Session refresh:** `src/lib/supabase/middleware.ts` — `updateSession()` helper
- **Public paths:** `/login`, `/register`, `/auth/callback`
- **Protected:** All other routes redirect to `/login` if no session

### Login Methods

- **Email + Password** — standard sign in
- **Magic Link** — passwordless OTP sent to email
- **Google OAuth** — configure in Supabase Dashboard → Auth → Providers → Google

### Registration Flow (No Public Signup)

1. User visits `/register` → submits name, email, phone
2. Record inserted into `registration_requests` table (status: `pending`)
3. Admin or HO Accountant reviews at `/admin/users` → Pending Requests tab
4. On approval: `supabase.auth.admin.inviteUserByEmail()` sends invite email
5. User row created in `users` table with Supabase UUID as ID
6. User clicks invite link → sets password → can log in

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

### Schema — Tables (9 total)

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
| `registration_requests` | Pending user access requests (status: pending/approved/rejected) |

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
| `ho_accountant` | All outlets | Create/edit all entries, all reports, export |
| `outlet_manager` | Assigned outlet only | Create/edit own entries, own reports |
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

| Feature           | Admin | HO Acc | Outlet Mgr | Outlet Acc |
| ----------------- | :---: | :----: | :--------: | :--------: |
| User Management   |  ✅   |   ✅   |     ❌     |     ❌     |
| Approve Requests  |  ✅   |   ✅   |     ❌     |     ❌     |
| Chart of Accounts |  ✅   |   ✅   |     ✅     |     ✅     |
| All Reports       |  ✅   |   ✅   |     ❌     |     ❌     |
| Own Reports       |  ✅   |   ✅   |     ✅     |     ✅     |
| All Outlets       |  ✅   |   ✅   |     ❌     |     ❌     |
| New Entry         |  ✅   |   ✅   |     ✅     |     ✅     |

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

| Component         | Path                                      | Purpose                        |
| ----------------- | ----------------------------------------- | ------------------------------ |
| TopNav            | `components/shared/TopNav.tsx`            | Navigation with Supabase user  |
| ClientLayout      | `components/shared/ClientLayout.tsx`      | Root layout wrapper            |
| DailyEntryForm    | `components/forms/DailyEntryForm.tsx`     | Entry form with tally          |
| UserForm          | `components/forms/UserForm.tsx`           | User CRUD form                 |
| AccountsDataTable | `components/tables/AccountsDataTable.tsx` | Reports table                  |

### UI Components (shadcn/ui)

button, input, select, card, form, label, table, container, badge, switch, avatar, dropdown-menu, dialog

---

## Key Files

| File                                    | Purpose                              |
| --------------------------------------- | ------------------------------------ |
| `src/middleware.ts`                     | Route protection + session refresh (root) |
| `src/lib/actions/audit.ts`             | `logAudit()` helper → writes to `audit_logs` table |
| `src/types/supabase.ts`                | Generated Supabase TypeScript types  |
| `src/lib/supabase/client.ts`            | Browser Supabase client              |
| `src/lib/supabase/server.ts`            | Server Supabase client (async)       |
| `src/lib/supabase/middleware.ts`        | updateSession() helper               |
| `src/db/schema.ts`                      | Drizzle schema (9 tables)            |
| `src/db/index.ts`                       | postgres.js + Drizzle client         |
| `src/db/seed.ts`                        | Database seeding script              |
| `drizzle.config.ts`                     | Drizzle config (uses DIRECT_URL)     |
| `src/lib/permissions.ts`               | RBAC permission matrix               |
| `src/lib/actions/accounts.ts`          | Daily account server actions         |
| `src/lib/actions/users.ts`             | User CRUD actions                    |
| `src/lib/actions/registrations.ts`     | Registration request actions         |
| `src/lib/actions/coa.ts`               | Chart of Accounts actions            |
| `src/lib/validations/entry.ts`         | Zod validation schemas               |
| `src/app/login/page.tsx`               | Login page (password/magic/Google)   |
| `src/app/register/page.tsx`            | Registration request page            |
| `src/app/api/auth/callback/route.ts`   | Supabase PKCE callback handler       |
| `src/app/api/registration-requests/route.ts` | Public registration endpoint   |

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
- [ ] **Email provider:** Replace Supabase built-in SMTP (2 emails/hr limit) with Resend — configure at Supabase Dashboard → Settings → Auth → SMTP (host: smtp.resend.com, port: 587, user: resend, pass: API key)
- [ ] **Vercel redeploy:** Trigger new deployment to pick up all recent changes
- [ ] **Chart of Accounts UI:** Complete CRUD pages (schema done, UI partial)
- [ ] **Advanced analytics:** Trend charts, month-over-month comparisons
- [ ] **Email notifications:** Alert admin when daily entry is missed
- [ ] **PWA:** Enhance manifest.json for offline-first capability

---

## Notes

- All routes protected except `/login`, `/register`, `/auth/callback`
- Seed data: 30 days of dummy financial data for all 14 outlets (420 entries)
- All monetary values: `NUMERIC(12,2)` — no floating-point errors
- All dates/times: IST (UTC+5:30)
- All currency: INR (₹) format
- Server actions enforce outlet from session — managers cannot submit for other outlets
- `SUPABASE_SERVICE_ROLE_KEY` is used ONLY in server actions, never exposed to client
- `src/proxy.ts` handles session refresh + auth redirect (Next.js 16 proxy — matcher excludes all `_next/` paths)
