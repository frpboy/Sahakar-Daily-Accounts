# Sahakar Daily Accounts (DOAMS)

Daily Outlet Account Management System for Sahakar Group — a multi-outlet retail financial entry and reporting platform.

**Production:** https://doams.vercel.app

---

## Overview

DOAMS lets outlet staff record daily financial figures (sales, expenses, stock) and gives management a consolidated view across all 14 outlets. Role-based access controls what each user can see and do.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.2.2 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS + shadcn/ui | latest |
| Database | Supabase (PostgreSQL) | hosted |
| ORM | Drizzle ORM | latest |
| Auth | Supabase Auth (email/password, magic link) | latest |
| Validation | Zod | latest |
| Email | Brevo SMTP (via Supabase Auth SMTP settings) | — |
| Deployment | Vercel | — |

## User Roles

| Role | Access |
|---|---|
| `admin` | Full access — user management, all outlets, all reports, approve registrations |
| `ho_accountant` | All outlets + reports, create/edit/delete all entries, view users (read-only) |
| `outlet_manager` | Own outlet only — create/edit/delete entries within the last 31 days, own reports, manage outlet accountant users for the assigned outlet |
| `outlet_accountant` | Own outlet only — create/edit entries for own outlet, own reports |

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── overview/          # Consolidated admin dashboard
│   │   ├── settings/          # Profile, password, notifications
│   │   └── users/             # User management
│   ├── api/
│   │   ├── auth/callback/     # Supabase PKCE callback
│   │   ├── all-reports/       # Reports API (admin/ho)
│   │   ├── own-reports/       # Reports API (outlet users)
│   │   ├── dashboard-stats/   # Dashboard KPIs
│   │   ├── outlets/           # Outlet CRUD
│   │   ├── outlets-list/      # Outlet list
│   │   ├── outlets-stats/     # Per-outlet stats
│   │   └── registration-requests/ # Public registration
│   ├── accounts/chart-of-accounts/
│   ├── dashboard/
│   ├── entry/                 # Daily entry form
│   ├── login/
│   ├── outlets/
│   ├── register/
│   ├── reports/
│   ├── update-password/       # Post-reset password change
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── admin/                 # UsersList, RegistrationRequestsList
│   ├── forms/                 # DailyEntryForm, UserForm
│   ├── settings/              # SettingsPages, NotificationSettings
│   ├── shared/                # TopNav, ClientLayout, PWAPrompt
│   ├── tables/                # AccountsDataTable
│   └── ui/                    # shadcn/ui components
├── db/
│   ├── schema.ts              # 12-table Drizzle schema
│   ├── index.ts               # postgres.js + Drizzle client
│   └── seed.ts                # Seed script
├── lib/
│   ├── actions/               # Server actions (accounts, users, registrations, audit, coa)
│   ├── supabase/              # client.ts, server.ts
│   ├── permissions.ts         # RBAC matrix
│   ├── export.ts              # jsPDF export
│   └── validations/           # Zod schemas
├── types/supabase.ts          # Generated Supabase types
└── proxy.ts                   # Next.js 16 routing middleware
```

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### 1. Clone and install

```bash
git clone https://github.com/frpboy/Sahakar-Daily-Accounts.git
cd Sahakar-Daily-Accounts
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
# Supabase — Transaction Pooler (port 6543, used at runtime)
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres

# Supabase — Direct connection (port 5432, used by drizzle-kit only)
DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Never expose to client
```

### 3. Push schema and seed

```bash
npm run db:push    # Push Drizzle schema to Supabase
npm run db:seed    # Seed 14 outlets + 420 dummy entries
```

### 4. Run development server

```bash
npm run dev
# Open http://localhost:3000
```

## Available Scripts

```bash
npm run dev           # Dev server (Turbopack)
npm run build         # Production build
npm run lint          # ESLint
npm run db:push       # Push schema to Supabase (uses DIRECT_URL)
npm run db:generate   # Generate Drizzle migration files
npm run db:studio     # Open Drizzle Studio
npm run db:seed       # Seed database
npm run format        # Prettier format
```

## Database

**Provider:** Supabase PostgreSQL (project: `grdeedwkzqyfxgfeskdr`)

**12 tables:** `outlets`, `users`, `daily_accounts`, `account_categories`, `account_groups`, `chart_of_accounts`, `audit_logs`, `notifications`, `registration_requests`, `financial_years`, `system_preferences`, `submission_reminders`

Key constraint: `daily_accounts(outlet_id, date)` UNIQUE — one entry per outlet per day.

All monetary values use `NUMERIC(12,2)` — no floating-point errors.

## Authentication

- Email + Password sign-in
- Magic link sign-in
- Forgot password → email reset link → `/update-password`
- Registration request flow: user submits request at `/register` → admin approves → user can log in immediately
- Admin-created users are provisioned in Supabase Auth first, then mirrored into the app `users` table
- No public self-signup — all accounts require admin approval
- Routing middleware: `src/proxy.ts` — protects all routes, allows `/login`, `/register`, `/api/auth/callback`, `/update-password`

## Reports

- `/api/all-reports` and `/api/own-reports` are paginated server-side
- Default UI page size is `50`
- CSV export requests all filtered rows with `includeAll=true`, so exports are not truncated by the current page
- `/reports` supports `outlet`, `from`, `to`, and `page` query params
- `/reports/own` supports `from`, `to`, and `page` query params

## Date Handling

- Business dates use explicit `YYYY-MM-DD` parsing/formatting helpers instead of `toISOString().split("T")[0]`
- This avoids day-shift bugs for IST users when editing or submitting daily entries

## Deep Links

- `/entry?date=YYYY-MM-DD&outletId=<uuid>` opens the entry form in edit/prefill mode for an existing daily account.
- `/reports?outlet=<uuid>&from=YYYY-MM-DD&to=YYYY-MM-DD&page=<n>` keeps admin and HO report filters bookmarkable/shareable.
- `/reports/own?from=YYYY-MM-DD&to=YYYY-MM-DD&page=<n>` keeps own-report date filters bookmarkable/shareable.
- `/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD` keeps the dashboard KPI time range bookmarkable/shareable.

## PWA

- Manifest at `public/manifest.json`
- Service worker at `public/sw.js`
- Install prompt via `beforeinstallprompt`
- Push notification permission managed in Settings → Notifications

## Deployment

Push to `main` → Vercel auto-deploys.

Required Vercel environment variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase Transaction Pooler (port 6543) |
| `DIRECT_URL` | Supabase Direct connection (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) |

## Production Checklist

- [x] Supabase project configured with SMTP (Brevo)
- [x] All environment variables set in Vercel
- [x] RBAC enforced at page and server action level
- [x] Audit logging for all mutating actions
- [x] TypeScript zero errors
- [ ] Custom email sender domain (currently using Gmail via Brevo)
- [ ] Server-side push notifications (VAPID)
