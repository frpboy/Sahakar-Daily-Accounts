# Sahakar Daily Accounts - Implementation Log

## Project Overview

**Project Name:** Sahakar Daily Accounts (DOAMS)
**Tech Stack:** Next.js 16.2.2, PostgreSQL (Neon), Drizzle ORM, Tailwind CSS, shadcn/ui
**Date Started:** 2026-04-01
**Last Updated:** 2026-04-02

---

## Current Routes

| Route                         | Type     | Description          |
| ----------------------------- | -------- | -------------------- |
| `/`                           | Redirect | → `/admin/overview`  |
| `/admin/overview`             | Static   | Admin dashboard      |
| `/admin/users`                | Static   | User management      |
| `/dashboard`                  | Client   | Role-based dashboard |
| `/entry`                      | Client   | Daily entry form     |
| `/reports`                    | Client   | All outlets reports  |
| `/reports/own`                | Client   | Own outlet reports   |
| `/outlets`                    | Client   | All outlets view     |
| `/accounts/chart-of-accounts` | Static   | Chart of Accounts    |
| `/login`                      | Static   | Login page           |
| `/test`                       | Static   | Test page            |

## API Routes

| Route                  | Method | Purpose                  |
| ---------------------- | ------ | ------------------------ |
| `/api/dashboard-stats` | GET    | Dashboard statistics     |
| `/api/outlets-stats`   | GET    | All outlets with stats   |
| `/api/outlets-list`    | GET    | List all outlets         |
| `/api/all-reports`     | GET    | All reports with filters |
| `/api/own-reports`     | GET    | Own outlet reports       |

---

## Database Schema

### Tables

- **outlets** - 14 outlets with codes (SHP-001 to SSC-007)
- **users** - User accounts with roles
- **daily_accounts** - Daily financial entries
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
SHP-001  MANJERI           Hyper Pharmacy
SSC-001  MANJERI (SC)      Smart Clinic
SHP-002  ALANALLUR         Hyper Pharmacy
SSC-002  ALANALLUR (SC)    Smart Clinic
SHP-003  KARINKALLATHANI   Hyper Pharmacy
SSC-003  KARINKALLATHANI (SC) Smart Clinic
SHP-004  MELATTUR          Hyper Pharmacy
SSC-004  MELATTUR (SC)     Smart Clinic
SHP-005  TIRUR             Hyper Pharmacy
SSC-005  TIRUR (SC)        Smart Clinic
SHP-006  MAKKARAPARAMBU    Hyper Pharmacy
SSC-006  MAKKARAPARAMBU (SC) Smart Clinic
SHP-007  TIRURANAGADI      Hyper Pharmacy
SSC-007  TIRURANAGADI (SC) Smart Clinic
```

### Admin User

- **Name:** Rahul
- **Email:** frpboy12@gmail.com
- **Role:** admin

---

## Implemented Features

### 1. Daily Entry Form

- Date & Outlet selection
- Total Sales Amount input (red box)
- Payment methods: Cash, UPI, Credit
- Tally validation - checks if payment methods = total sales
- Toast notifications for match/mismatch
- Operations: Expenses, Purchase, Closing Stock

### 2. User Management

- Create/Edit/Delete users
- Role assignment: Admin, HO Accountant, Outlet Manager, Outlet Accountant
- Branch/Outlet assignment
- Active/Inactive toggle

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

### 5. Outlets View

- Card grid of all outlets
- Stats per outlet: Sales, Expenses, Entries, Net Profit

---

## Components

| Component         | Path                                      | Purpose                   |
| ----------------- | ----------------------------------------- | ------------------------- |
| TopNav            | `components/shared/TopNav.tsx`            | Navigation with user menu |
| ClientLayout      | `components/shared/ClientLayout.tsx`      | Root layout wrapper       |
| DailyEntryForm    | `components/forms/DailyEntryForm.tsx`     | Entry form with tally     |
| UserForm          | `components/forms/UserForm.tsx`           | User CRUD form            |
| AccountsDataTable | `components/tables/AccountsDataTable.tsx` | Reports table             |

### UI Components

button, input, select, card, form, label, table, container, badge, switch, avatar, dropdown-menu

---

## Key Files

| File                           | Purpose                     |
| ------------------------------ | --------------------------- |
| `src/db/schema.ts`             | Database schema definitions |
| `src/db/seed.ts`               | Database seeding script     |
| `src/lib/permissions.ts`       | RBAC permission system      |
| `src/lib/auth-context.tsx`     | Auth context (disabled)     |
| `src/lib/actions/accounts.ts`  | Account server actions      |
| `src/lib/actions/users.ts`     | User CRUD actions           |
| `src/lib/validations/entry.ts` | Form validation schemas     |

---

## Commands

```bash
npm run build                          # Build
npm run dev                            # Development
powershell -ExecutionPolicy Bypass -File run-seed.ps1  # Database Seed
```

---

## Notes

- Auth is **disabled** for development viewing
- Seed data includes 30 days of dummy data for all 14 outlets
- Total seeded entries: 420 (30 days × 14 outlets)
- Neon PostgreSQL database connected via environment variables
- Schema synced with database (text type, no enum)
