# PRD: Daily Outlet Account Management System (DOAMS)

**Version:** 2.0 (Current Implementation)
**Status:** ~85% Complete
**Production:** https://doams.vercel.app

---

## 1. Project Overview

DOAMS is a centralized web application for Sahakar Group to manage daily financial records across 14 retail outlets. Outlet staff record daily figures (sales, expenses, stock); management gets consolidated reporting and analytics across all locations.

---

## 2. User Personas

| Persona | Role | Responsibilities |
|---|---|---|
| **Admin** | Owner / IT Admin | User management, full data access, approve new staff |
| **HO Accountant** | Head Office | View all outlets, edit all entries, consolidated reports |
| **Outlet Manager** | Branch Manager | Enter and view daily data for their outlet only |
| **Outlet Accountant** | Branch Staff | Enter and view daily data for their outlet only |

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

- Email + password login
- Magic link (passwordless) login
- Forgot password → reset link by email → `/update-password` page
- Registration request flow — no public signup; users request access at `/register`, admin approves
- Role-based access — enforced at page level (server-side redirect), server action level, and UI level
- Session managed by Supabase Auth; route protection via `src/proxy.ts`

### 3.2 Daily Entry Form

- Date selection (defaults to today, IST timezone)
- Outlet selector — admins/HO see all 14 outlets; outlet staff see only their assigned outlet
- **Sales inputs:** Sale by Cash, Sale by UPI, Sale by Credit
- **Auto-calculated Total Sale** displayed in real time
- **Tally validation** — warns if payment methods don't sum to total sale
- **Operations inputs:** Sales Return, Expenses, Purchase, Closing Stock
- Overwrite protection — if an entry already exists for selected date + outlet, shows amber warning; requires explicit confirmation before overwriting
- Server enforces outlet from session — outlet users cannot submit for other outlets

### 3.3 User Management (Admin only)

- Create, edit, delete users
- Assign role and outlet
- Toggle active/inactive
- Inline edit on users list
- Approve or reject registration requests (admin only)
- Registration approval creates Supabase Auth account with the password the user set — no invite email required

### 3.4 Reports & Dashboard

- **All Reports** (admin/HO): tabular view with outlet + date range filters, CSV export, PDF export
- **Own Reports** (outlet users): own outlet data only
- Summary cards: Total Sales, Total Expenses, Net Profit
- Loading skeleton on data fetch
- `/admin/overview` — consolidated recent submissions table

### 3.5 Outlets

- Grid of all 14 outlets with per-outlet stats
- Create new outlet
- Individual outlet detail pages

### 3.6 Settings

- Profile: edit name, phone; outlet card shown prominently for outlet-level users
- Change Password: update login password via `supabase.auth.updateUser`
- Notifications: manage browser push notification permission; test notification; service worker status

### 3.7 PWA

- Installable via `beforeinstallprompt` banner
- Service worker handles push events and notification clicks
- Manifest with icons, `display: standalone`, `start_url: /dashboard`

---

## 4. Technical Specifications

### 4.1 Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16.2.2 (App Router, Turbopack) | Server Components + Server Actions |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS + shadcn/ui | Geist-inspired design system |
| Database | Supabase PostgreSQL | Hosted, project: `grdeedwkzqyfxgfeskdr` |
| ORM | Drizzle ORM | `postgres.js` driver, `prepare: false` for PgBouncer |
| Auth | Supabase Auth | Email/password, magic link, password reset |
| Email | Brevo SMTP | 300/day free tier, configured in Supabase SMTP settings |
| PDF Export | jsPDF + jspdf-autotable | Dynamic import to avoid SSR issues |
| Deployment | Vercel | Auto-deploy from `main` branch |

### 4.2 Database Schema (12 tables)

```sql
outlets               -- 14 retail locations
users                 -- staff accounts (id = Supabase Auth UUID)
daily_accounts        -- core financial entries (UNIQUE outlet_id + date)
account_categories    -- COA level 1
account_groups        -- COA level 2 (self-referential hierarchy)
chart_of_accounts     -- COA level 3
audit_logs            -- full action audit trail (JSONB old/new data)
notifications         -- user notifications
registration_requests -- pending access requests (password stored, cleared after approval)
financial_years       -- FY cycles
system_preferences    -- global/per-outlet config key-value pairs
submission_reminders  -- scheduled reminder times
```

All monetary fields: `NUMERIC(12, 2)` — no floating-point errors.
Unique constraint: `daily_accounts(outlet_id, date)`.

### 4.3 RBAC Enforcement

| Capability | Admin | HO Accountant | Outlet Roles |
|---|:---:|:---:|:---:|
| Add/edit/delete users | ✅ | ❌ | ❌ |
| Approve/reject registrations | ✅ | ❌ | ❌ |
| View users list | ✅ | ✅ read-only | ❌ |
| All outlet data | ✅ | ✅ | ❌ |
| Own outlet data | ✅ | ✅ | ✅ |
| All reports + export | ✅ | ✅ | ❌ |
| Own reports + export | ✅ | ✅ | ✅ |

Enforced in: `src/proxy.ts` (route guard), page-level `redirect()`, server actions (DB role check before mutate), UI (conditional rendering).

---

## 5. UI/UX Requirements

- Mobile-first — numeric inputs use `inputmode="decimal"` for number pad on mobile
- Geist-inspired monochrome design with emerald accents
- Toast notifications (Sonner) for all form feedback
- Loading skeletons for data-heavy pages
- Error boundaries on `/entry` and `/reports`

---

## 6. Non-Functional Requirements

- **Accuracy:** All financial fields use `NUMERIC(12,2)` in PostgreSQL — never float
- **Security:** Server-side RBAC on every mutating action; `SUPABASE_SERVICE_ROLE_KEY` never exposed to client; audit log on every create/update/delete
- **Integrity:** One entry per outlet per day enforced at DB level (UNIQUE constraint) and UI level (overwrite confirmation)
- **Performance:** Turbopack dev, IST dates, INR formatting

---

## 7. Pending Features

- [ ] Chart of Accounts UI (schema complete, CRUD pages partial)
- [ ] Server-side push notifications (VAPID keys + subscription endpoint)
- [ ] Advanced analytics (trend charts, month-over-month)
- [ ] Google OAuth (removed — needs Google Cloud credentials)
- [ ] Custom email sender domain for Brevo (currently Gmail sender hits DMARC)
- [ ] Email alert to admin when an outlet misses daily entry
