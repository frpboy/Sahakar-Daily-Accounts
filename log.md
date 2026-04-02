# Sahakar Daily Accounts - Implementation Log

## Project Overview

**Project Name:** Sahakar Daily Accounts (DOAMS)
**Tech Stack:** Next.js 16.2.2, PostgreSQL (Neon), Drizzle ORM, Tailwind CSS, shadcn/ui, Kinde Auth
**Date Started:** 2026-04-01
**Last Updated:** 2026-04-02
**Production URL:** https://doams.vercel.app

---

## Current Routes

| Route                         | Type     | Description          |
| ----------------------------- | -------- | -------------------- |
| `/`                           | Redirect | → `/admin/overview`  |
| `/login`                      | Static   | Kinde login/register |
| `/admin/overview`             | Static   | Admin dashboard      |
| `/admin/users`                | Static   | User management      |
| `/dashboard`                  | Static   | Dashboard            |
| `/entry`                      | Static   | Daily entry form     |
| `/reports`                    | Static   | All outlets reports  |
| `/reports/own`                | Static   | Own outlet reports   |
| `/outlets`                    | Static   | All outlets view     |
| `/outlets/[id]`               | Dynamic  | Single outlet detail |
| `/accounts/chart-of-accounts` | Static   | Chart of Accounts    |
| `/test`                       | Static   | Test page            |

## API Routes

| Route                   | Method | Purpose                  |
| ----------------------- | ------ | ------------------------ |
| `/api/auth/[kindeAuth]` | GET    | Kinde auth endpoints     |
| `/api/dashboard-stats`  | GET    | Dashboard statistics     |
| `/api/outlets-stats`    | GET    | All outlets with stats   |
| `/api/outlets-list`     | GET    | List all outlets         |
| `/api/outlets`          | POST   | Create new outlet        |
| `/api/all-reports`      | GET    | All reports with filters |
| `/api/own-reports`      | GET    | Own outlet reports       |

---

## Authentication (Kinde)

### Setup

- **Provider:** Kinde (https://doams.kinde.com)
- **SDK:** `@kinde-oss/kinde-auth-nextjs`
- **Middleware:** `src/middleware.ts` with `withAuth` helper
- **Provider:** `src/app/AuthProvider.tsx` with `KindeProvider`
- **Public paths:** `/login`
- **Protected:** All routes except `/login` and static files
- **Redirect:** After login → `/dashboard`

### Auth Components

- `LoginLink`, `RegisterLink` - Sign in/up buttons
- `LogoutLink` - Sign out button
- `useKindeBrowserClient()` - Client-side auth data
- `getKindeServerSession()` - Server-side auth data

### User Data Available

- `id`, `email`, `given_name`, `family_name`, `picture`, `username`, `phone_number`

---

## Database Schema

### Tables

- **outlets** - 14 outlets (7 locations × 2 businesses)
- **users** - User accounts with roles
- **daily_accounts** - Daily financial entries (includes `sale_return` column)
- **account_categories** - Asset, Liability, Equity, Revenue, Expense
- **account_groups** - Sub-groups under categories
- **chart_of_accounts** - Individual accounts with codes
- **audit_logs** - Audit trail
- **notifications** - User notifications

### User Roles

1. **admin** - Full access
2. **ho_accountant** - Head Office - all branches
3. **outlet_manager** - Single outlet management
4. **outlet_accountant** - Single outlet accounting

### Outlets (14 total)

```
SAHAKAR HYPER PHARMACY - MANJERI
SAHAKAR SMART CLINIC - MANJERI
SAHAKAR HYPER PHARMACY - ALANALLUR
SAHAKAR SMART CLINIC - ALANALLUR
SAHAKAR HYPER PHARMACY - KARINKALLATHANI
SAHAKAR SMART CLINIC - KARINKALLATHANI
SAHAKAR HYPER PHARMACY - MELATTUR
SAHAKAR SMART CLINIC - MELATTUR
SAHAKAR HYPER PHARMACY - TIRUR
SAHAKAR SMART CLINIC - TIRUR
SAHAKAR HYPER PHARMACY - MAKKARAPARAMBU
SAHAKAR SMART CLINIC - MAKKARAPARAMBU
SAHAKAR HYPER PHARMACY - TIRURANAGADI
SAHAKAR SMART CLINIC - TIRURANAGADI
```

### Admin User

- **Name:** Rahul
- **Email:** frpboy12@gmail.com
- **Role:** admin

---

## Implemented Features

### 1. Daily Entry Form

- Date & Outlet selection
- Total Sales Amount input (red box with dynamic border color)
- Payment methods: Cash, UPI, Credit (3-column grid)
- Sales Return field (in Operations section, 4-column grid)
- Tally validation - checks if payment methods = total sales
- Toast notifications (Sonner) for match/mismatch
- Operations: Sales Return, Expenses, Purchase, Closing Stock
- IST timezone enforcement for dates
- INR currency formatting (₹)

### 2. User Management

- Create/Edit/Delete users
- Role assignment: Admin, HO Accountant, Outlet Manager, Outlet Accountant
- Branch/Outlet assignment (required for outlet-level roles)
- Active/Inactive toggle
- Email uniqueness validation

### 3. RBAC Permissions

| Feature           | Admin | HO Acc | Outlet Mgr | Outlet Acc |
| ----------------- | :---: | :----: | :--------: | :--------: |
| User Management   |  ✅   |   ✅   |     ❌     |     ❌     |
| Chart of Accounts |  ✅   |   ✅   |     ✅     |     ✅     |
| All Reports       |  ✅   |   ✅   |     ❌     |     ❌     |
| Own Reports       |  ✅   |   ✅   |     ✅     |     ✅     |
| All Outlets       |  ✅   |   ✅   |     ❌     |     ❌     |
| New Entry         |  ✅   |   ✅   |     ✅     |     ✅     |

### 4. Reports

- All Reports: Filter by outlet, export CSV
- Own Reports: View own outlet data, export CSV
- Summary cards: Total Sales, Expenses, Net Profit
- Date range filtering

### 5. Outlets View

- Card grid of all outlets
- Stats per outlet: Sales, Expenses, Entries, Net Profit
- Create new outlet dialog
- Outlet detail pages

### 6. Navigation

- Geist Design System inspired navbar
- Section labels: Dashboard, Entries, Reports, Outlets, Accounts, Staff
- Active state highlighting with `pathname.startsWith()`
- User dropdown with avatar and Kinde user info
- Mobile responsive hamburger menu
- LogoutLink integration

### 7. UI/UX

- Inter font family
- Geist Design System color palette (10-step gray scale)
- No italics enforced globally
- Toast notifications (Sonner) for form feedback
- Dark mode CSS variables defined

---

## Components

| Component         | Path                                      | Purpose                   |
| ----------------- | ----------------------------------------- | ------------------------- |
| TopNav            | `components/shared/TopNav.tsx`            | Navigation with user menu |
| ClientLayout      | `components/shared/ClientLayout.tsx`      | Root layout wrapper       |
| AuthProvider      | `app/AuthProvider.tsx`                    | Kinde provider wrapper    |
| DailyEntryForm    | `components/forms/DailyEntryForm.tsx`     | Entry form with tally     |
| UserForm          | `components/forms/UserForm.tsx`           | User CRUD form            |
| AccountsDataTable | `components/tables/AccountsDataTable.tsx` | Reports table             |

### UI Components

button, input, select, card, form, label, table, container, badge, switch, avatar, dropdown-menu, dialog

---

## Key Files

| File                           | Purpose                     |
| ------------------------------ | --------------------------- |
| `src/db/schema.ts`             | Database schema definitions |
| `src/db/seed.ts`               | Database seeding script     |
| `src/middleware.ts`            | Kinde auth middleware       |
| `src/app/AuthProvider.tsx`     | KindeProvider wrapper       |
| `src/lib/permissions.ts`       | RBAC permission system      |
| `src/lib/actions/accounts.ts`  | Account server actions      |
| `src/lib/actions/users.ts`     | User CRUD actions           |
| `src/lib/validations/entry.ts` | Form validation schemas     |
| `src/lib/utils.ts`             | Utility functions           |

---

## Commands

```bash
npm run build                          # Build
npm run dev                            # Development
npm run lint                           # ESLint
powershell -ExecutionPolicy Bypass -File run-seed.ps1  # Database Seed
vercel --prod                          # Deploy to production
```

---

## Deployment

- **Platform:** Vercel
- **Production URL:** https://doams.vercel.app
- **Build Status:** ✅ Successful
- **TypeScript:** ✅ No errors

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Kinde Auth
KINDE_CLIENT_ID=f45549431a8f46deadfb224f824b8039
KINDE_CLIENT_SECRET=...
KINDE_ISSUER_URL=https://doams.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/dashboard
```

---

## Required SQL (Run in Neon Console)

```sql
-- Add sale_return column
ALTER TABLE daily_accounts ADD COLUMN IF NOT EXISTS sale_return NUMERIC(12, 2) DEFAULT '0';
```

---

## Notes

- Auth is **enabled** with Kinde
- All routes protected except `/login`
- Seed data includes 30 days of dummy data for all 14 outlets
- Total seeded entries: 420 (30 days × 14 outlets)
- Neon PostgreSQL database connected via environment variables
- All dates/times use IST (UTC+5:30)
- All currency uses INR (₹) format
- Sonner toast notifications used for form feedback
- No italics enforced globally via CSS
