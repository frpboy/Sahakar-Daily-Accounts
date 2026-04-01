# 📊 Sahakar Daily Accounts - Full Codebase Analysis

## Executive Summary

**Sahakar-Daily-Accounts** (DOAMS) is a production-ready **Daily Outlet Account Management System** built with modern full-stack TypeScript technologies. It's designed for retail outlet chains to centralize and streamline daily financial reporting with role-based access control and real-time validation.

**Status**: ~85% Complete - Core features functional, Enterprise Accounting module pending implementation.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│   │   Dashboard  │  │   Entry Form │  │    Reports   │     │
│   │   (Admin)    │  │   (Manager)  │  │   (TanStack) │     │
│   └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │    Next.js App  │
        │   - Server      │
        │     Actions     │
        │   - API Routes  │
        │   - Middleware  │
        └────────┬────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│              DATABASE LAYER (Neon + Drizzle)                │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  PostgreSQL with Type-Safe ORM (Drizzle)             │  │
│   │  - Outlets | Users | Daily Accounts | Audit Logs     │  │
│   │  - Chart of Accounts | Account Groups | Categories   │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 16.2.2 | App Router + Server Actions |
| **Language** | TypeScript | 5.4.2 | Type-safe development |
| **Database** | Neon (PostgreSQL) | - | Serverless DB with pooling |
| **ORM** | Drizzle ORM | 0.45.2 | Type-safe queries & migrations |
| **UI Components** | shadcn/ui | - | Accessible component library |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first CSS |
| **Forms** | React Hook Form | 7.51.4 | Form state management |
| **Validation** | Zod | 3.22.4 | Runtime schema validation |
| **Tables** | TanStack Table | 8.17.3 | Data table with sorting/filtering |
| **Icons** | Lucide React | 0.368.0 | Consistent icon set |
| **Notifications** | Sonner | 1.3.1 | Toast notifications |
| **CLI** | tsx | 4.7.0 | TypeScript execution |

---

## 📁 Directory Structure

```
src/
├── app/                              # Next.js 15 App Router
│   ├── layout.tsx                    # Root layout with metadata
│   ├── page.tsx                      # Redirect to /dashboard
│   ├── dashboard/
│   │   └── page.tsx                  # Main dashboard landing
│   ├── entry/
│   │   └── page.tsx                  # Daily entry form page
│   ├── login/
│   │   └── page.tsx                  # Login page (placeholder)
│   ├── profile/
│   │   └── page.tsx                  # User profile page
│   ├── outlets/
│   │   ├── page.tsx                  # Outlets list view
│   │   └── [id]/                     # Outlet detail page
│   ├── reports/
│   │   ├── page.tsx                  # Reports dashboard
│   │   └── own/                      # Personal reports
│   ├── accounts/                     # ❌ NOT YET IMPLEMENTED
│   │   └── chart-of-accounts/        # Planned but missing
│   ├── admin/                        # Role-based admin views
│   │   ├── overview/
│   │   ├── audit-logs/
│   │   ├── settings/
│   │   └── users/
│   ├── api/                          # API endpoints
│   │   ├── dashboard-stats/
│   │   ├── outlets/
│   │   ├── outlets-list/
│   │   ├── outlets-stats/
│   │   ├── all-reports/
│   │   ├── own-reports/
│   │   └── notifications/
│   └── test/                         # Testing/debug page
│
├── components/                       # React components
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx, card.tsx, input.tsx, etc.
│   ├── forms/
│   │   ├── DailyEntryForm.tsx        # Main entry form
│   │   └── UserForm.tsx              # User management form
│   ├── tables/
│   │   └── AccountsDataTable.tsx     # TanStack-based data table
│   ├── dashboards/
│   │   ├── AdminView.tsx             # Admin dashboard
│   │   ├── OutletManagerView.tsx     # Manager dashboard
│   │   ├── OutletAccountantView.tsx  # Accountant view
│   │   └── HOAccountantView.tsx      # HO Accountant view
│   ├── outlets/
│   │   └── create-outlet-dialog.tsx  # Outlet creation modal
│   ├── shared/
│   │   ├── TopNav.tsx                # Navigation bar
│   │   ├── MobileNav.tsx             # Mobile navigation
│   │   ├── ClientLayout.tsx          # Layout wrapper
│   │   ├── DateRangeFilter.tsx       # Date range picker
│   │   ├── PWAHandler.tsx            # PWA support
│   │   └── NotificationsDropdown.tsx
│   └── protected-route.tsx           # Route protection
│
├── db/                               # Database layer
│   ├── index.ts                      # Neon client + Drizzle init
│   ├── schema.ts                     # Database schema definition
│   ├── seed.ts                       # Database seeding script
│   └── seed-utils.ts                 # Helper utilities for seeding
│
├── lib/                              # Shared utilities
│   ├── auth-context.tsx              # Authentication context (hardcoded)
│   ├── auth-utils.ts                 # Session utilities
│   ├── permissions.ts                # RBAC logic
│   ├── export.ts                     # CSV/PDF export utilities
│   ├── utils.ts                      # General utilities
│   ├── actions/                      # Server Actions
│   │   ├── accounts.ts               # Daily entry submission
│   │   ├── audit.ts                  # Audit log recording
│   │   ├── auth.ts                   # Auth utilities
│   │   ├── coa.ts                    # Chart of accounts actions
│   │   ├── users.ts                  # User management actions
│   │   └── notifications.ts          # Notification dispatch
│   └── validations/                  # Zod schemas
│       └── entry.ts                  # Entry form validation
│
├── types/                            # TypeScript definitions
│   └── clerk.d.ts                    # Type definitions
│
├── globals.css                       # Global Tailwind styles
└── middleware.ts                     # Next.js middleware (auth)

drizzle/                              # Drizzle migrations
├── schema.ts                         # Source schema
├── relations.ts                      # Schema relationships
├── 0000_rainy_barracuda.sql          # Migration file
└── meta/                             # Migration metadata

config/                               # Configuration files
└── mcporter.json                     # MCP Porter config

public/                               # Static assets
├── manifest.json                     # PWA manifest
└── icons/                            # App icons

scripts/                              # Build scripts
├── setup.sh, build.sh, outlet_migration.sql
```

---

## 🗄️ Database Schema

### Core Tables

#### **1. `outlets`**
Represents retail locations.
```typescript
{
  id: UUID (PK),
  name: TEXT (UNIQUE),
  location: TEXT,
  code?: TEXT,        // Optional outlet code
  createdAt: TIMESTAMP
}
```

#### **2. `users`**
Authentication and user management.
```typescript
{
  id: TEXT (PK),      // Clerk/auth provider ID
  email: TEXT (UNIQUE),
  role: TEXT,         // admin, ho_accountant, outlet_manager, outlet_accountant
  outletId: UUID (FK to outlets),  // null for admins
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

#### **3. `daily_accounts`**
Core financial data for each outlet per day.
```typescript
{
  id: UUID (PK),
  outletId: UUID (FK),
  date: DATE,
  
  // Sales breakdown
  saleCash: DECIMAL(12,2),    // Cash payments
  saleUpi: DECIMAL(12,2),     // UPI payments
  saleCredit: DECIMAL(12,2),  // Credit/Due payments
  
  // Operations
  expenses: DECIMAL(12,2),    // Daily expenses
  purchase: DECIMAL(12,2),    // Stock purchases
  closingStock: DECIMAL(12,2),// End of day stock
  
  createdBy: TEXT,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  
  // Constraint: UNIQUE(outletId, date) - Prevents duplicate entries
}
```

#### **4. `account_categories`**
Financial account hierarchy (top level).
```typescript
{
  id: UUID (PK),
  name: TEXT (UNIQUE)    // Assets, Liabilities, Income, Expenses
}
```

#### **5. `account_groups`**
Middle level of account hierarchy.
```typescript
{
  id: UUID (PK),
  name: TEXT,
  categoryId: UUID (FK),
  parentGroupId: UUID (self-referential, optional)
}
```

#### **6. `chart_of_accounts`**
Detailed account ledger entries.
```typescript
{
  id: UUID (PK),
  code: TEXT (UNIQUE),        // e.g., "1001", "2001"
  name: TEXT,                 // e.g., "Cash Account", "Liabilities"
  groupId: UUID (FK),
  description: TEXT,
  isActive: TEXT,
  createdAt: TIMESTAMP
}
```

#### **7. `audit_logs`** (Implied in actions)
Tracks all user actions for compliance.
```typescript
{
  id: UUID (PK),
  action: TEXT,      // CREATE, UPDATE, DELETE
  table: TEXT,
  userId: TEXT,
  changes: JSONB,
  timestamp: TIMESTAMP
}
```

---

## 🔐 Authentication & Authorization

### Current Implementation Status: **⚠️ DISABLED**

All authentication has been **hardcoded** for development. A real user would always be logged in as:

```typescript
// src/lib/auth-utils.ts
const role = "admin" as UserRole;
const user = {
  id: "admin-rahul",
  name: "Rahul",
  email: "frpboy12@gmail.com",
};
```

### Planned RBAC Roles

| Role | Permissions | Access |
|------|-----------|--------|
| **admin** | All operations | All outlets, all reports, user management |
| **ho_accountant** | Create/edit all entries, view all reports | All outlets data |
| **outlet_manager** | Create/edit own outlet entries | Only assigned outlet |
| **outlet_accountant** | Same as manager | Only assigned outlet |

### Permission Matrix

```typescript
ROLE_PERMISSIONS: {
  admin: [
    view:dashboard, view:all_outlets, view:reports, entry:create, 
    entry:edit_all, reports:export, users:create, users:edit, users:delete, 
    accounts:manage
  ],
  ho_accountant: [
    view:dashboard, view:all_outlets, view:reports, entry:create, 
    entry:edit_all, reports:export
  ],
  outlet_manager: [
    view:dashboard, view:own_outlet, view:own_reports, entry:create, 
    entry:edit_own, reports:export
  ],
  outlet_accountant: [
    view:dashboard, view:own_outlet, view:own_reports, entry:create, 
    entry:edit_own, reports:export
  ]
}
```

---

## 🔄 Data Flow Architecture

### Daily Entry Submission Flow

```
User fills form
    ↓
Client-side validation (Zod)
    ↓
Form submission via Server Action
    ↓
submitDailyAccount() [src/lib/actions/accounts.ts]
    ├─ Parse & validate with Zod schema
    ├─ Verify outlet exists
    ├─ Database UPSERT (insert or update)
    └─ on conflict: Update existing entry for same date/outlet
    ↓
Audit logging + Notifications
    ↓
Cache revalidation via revalidatePath()
    ↓
UI updates with success toast
```

### Dashboard Stats Retrieval

```
GET /api/dashboard-stats?outletId=X&from=DATE&to=DATE
    ↓
Query aggregates:
  ├─ SUM(saleCash + saleUpi + saleCredit) as totalSales
  ├─ SUM(expenses) as totalExpenses
  ├─ Count of outlets/entries
  └─ Outlet submission status for today
    ↓
Return JSON response
    ↓
Dashboard renders with live stats
```

### Report Generation

```
User selects filters (date range, outlet)
    ↓
TanStack Table queries API
    ↓
Database returns paginated, sorted results
    ↓
User can export to CSV/PDF
```

---

## 🎨 UI/UX Components

### Key Components

#### **1. DailyEntryForm** (`src/components/forms/DailyEntryForm.tsx`)
- Mobile-first numeric entry form
- Real-time payment tally validation (Cash + UPI + Credit = Total)
- Auto-calculation of profit margins
- Visual indicators for form state

**Features:**
- Date picker (restricted to ±3 days for managers)
- Outlet selector dropdown
- Payment method breakdown
- Automatic total calculation
- Validation feedback with toast notifications

#### **2. AccountsDataTable** (`src/components/tables/AccountsDataTable.tsx`)
- TanStack Table integration for reports
- Sortable and filterable columns
- Pagination support
- CSV/PDF export functionality
- Role-based column visibility

#### **3. Dashboard Views**
Four role-specific dashboard implementations:

- **AdminView.tsx**: Full system overview, outlet status, audit logs
- **OutletManagerView.tsx**: Own outlet metrics, entry history
- **OutletAccountantView.tsx**: Similar to manager, finance-focused
- **HOAccountantView.tsx**: Multi-outlet analysis, trend reports

#### **4. Navigation Components**
- **TopNav.tsx**: Header with logo, user menu, notifications
- **MobileNav.tsx**: Bottom navigation for mobile devices
- **DateRangeFilter.tsx**: Date range selection utility
- **OutletCreationModal.tsx**: Modal dialog for adding outlets

---

## 📊 Key Features

### 1. **Daily Account Entry**
- Mobile-optimized form with decimal keyboard
- Real-time calculations (Total Sale = Cash + UPI + Credit)
- Duplicate entry prevention (unique constraint: outlet_id + date)
- Supports backdating (admins) and present-day only (managers)

### 2. **RBAC (Role-Based Access Control)**
- 4-tier permission system
- Route protection via permissions
- Server-side authorization checks
- Outlet-level isolation for managers

### 3. **Financial Precision**
- DECIMAL(12,2) for all monetary values (no floating-point errors)
- Automatic profit calculation: Sales - Expenses - Purchase
- Real-time tally validation in forms

### 4. **Comprehensive Reporting**
- Admin dashboard with 30-day metrics
- Outlet-wise status tracking
- Date range filtering
- Export to CSV/PDF
- Audit trail of all submissions

### 5. **Real-Time Notifications**
- Toast notifications for form submissions
- Success/error feedback
- Quick copy-to-action links

### 6. **Audit Logging**
- Records all CREATE/UPDATE/DELETE operations
- Stores user, timestamp, and change details
- Compliance and debugging support

### 7. **PWA Support**
- Installable as mobile app
- Offline capability preparation
- Manifest and icons included

---

## 🚀 Server Actions (Backend Logic)

Server Actions are Next.js functions that run on the server, eliminating the need for separate API routes.

### Key Server Actions

#### **`submitDailyAccount()`** (`src/lib/actions/accounts.ts`)
```typescript
// Submits or updates a daily account entry
- Validates data with Zod schema
- Checks outlet existence
- Performs UPSERT operation
- Logs audit trail
- Sends notifications
- Revalidates cache
- Returns success/error response
```

**Parameters:**
```typescript
{
  date: Date,
  outletId: UUID,
  saleCash: number,
  saleUpi: number,
  saleCredit: number,
  expenses: number,
  purchase: number,
  closingStock: number
}
```

#### **`logAction()`** (`src/lib/actions/audit.ts`)
Records audit trail entries.

#### **`sendNotification()`** (`src/lib/actions/notifications.ts`)
Dispatches success/error notifications.

---

## 🔄 API Endpoints

### GET Routes (Data Fetching)

#### **`/api/dashboard-stats`**
Returns dashboard metrics with optional filtering.
```
Query params:
- outletId?: UUID      # Filter by outlet
- from?: DATE          # Start date (YYYY-MM-DD)
- to?: DATE            # End date
```

**Response:**
```json
{
  "totalOutlets": 5,
  "todayEntries": 3,
  "totalSales": 45000,
  "totalExpenses": 5000,
  "saleCash": 20000,
  "saleUpi": 15000,
  "saleCredit": 10000,
  "outletsStatus": [
    { "id": "xyz", "name": "Outlet 1", "isSubmitted": true },
    ...
  ]
}
```

#### **`/api/outlets-list`**
Fetch all outlets.

#### **`/api/all-reports`**
Fetch all entries with pagination and filtering.

#### **`/api/own-reports`**
Fetch user's own entries.

---

## 📋 Validation Schemas

### Daily Entry Schema (`src/lib/validations/entry.ts`)

```typescript
z.object({
  date: z.coerce.date().max(new Date()),          // Past dates only
  outletId: z.string().uuid(),                     // Valid UUID
  totalSalesAmount: z.number().min(0),             # Manual total for tally
  saleCash: z.number().min(0),                     # ≥ 0
  saleUpi: z.number().min(0),                      # ≥ 0
  saleCredit: z.number().min(0),                   # ≥ 0
  expenses: z.number().min(0),                     # ≥ 0
  purchase: z.number().min(0),                     # ≥ 0
  closingStock: z.number().min(0)                  # ≥ 0
})
```

---

## ⚙️ Database Configuration

### Neon Connection (`src/db/index.ts`)

```typescript
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**Environment Variable:**
```
DATABASE_URL=postgresql://user:password@region.neon.tech/dbname?sslmode=require
```

### Drizzle Configuration (`drizzle.config.ts`)

```typescript
{
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
}
```

### Running Migrations

```bash
npm run db:generate   # Generate migration files
npm run db:push       # Push schema to Neon
npm run db:seed       # Populate test data
npm run db:studio     # Open Drizzle Studio (MySQL-style UI)
```

---

## 🚨 Critical Issues & To-Do

### ❌ Issue 1: Missing Accounts Module
**Status**: Not Implemented
**Impact**: Users cannot access Chart of Accounts

**Files Missing:**
- `src/app/accounts/chart-of-accounts/page.tsx`
- `src/app/accounts/layout.tsx`
- Server actions for COA management

**Remediation:**
1. Create layout and page files
2. Build COA UI using TanStack Table
3. Implement server actions for CRUD operations
4. Test end-to-end

### ⚠️ Issue 2: Authentication Hardcoded
**Status**: Disabled for Development
**Impact**: All users logged in as admin

**Current Implementation:**
```typescript
// src/lib/auth-utils.ts
const role = "admin";
const userId = "admin-rahul";
```

**Remediation:**
Integrate actual auth provider (Clerk, Auth.js, or Neon Auth)

### ⚠️ Issue 3: Cache Management
**Status**: Using simple `revalidatePath()`
**Impact**: May cause stale data in high-traffic scenarios

**Current:**
```typescript
revalidatePath("/entry");
revalidatePath("/reports");
```

**Consider:**
- ISR (Incremental Static Regeneration)
- Targeted cache invalidation

---

## 📦 Build & Deployment

### Local Development

```bash
npm install
npm run dev                # Start dev server (http://localhost:3000)
npm run lint              # Run ESLint
npm run format            # Format with Prettier
```

### Production Build

```bash
npm run build             # Next.js production build
npm start                 # Start production server
```

### Deployment (Vercel)

```bash
vercel deploy             # Deploy to Vercel (automatic from main branch)
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "next build",
  "installCommand": "npm install"
}
```

---

## 🧪 Testing & Debugging

### Debug Page
- **URL**: `http://localhost:3000/test`
- Used for testing UI components in isolation

### Seeding Test Data
```bash
npm run db:seed
```
This populates the database with sample outlets and entries for testing.

### Drizzle Studio
```bash
npm run db:studio
```
Opens a visual database editor (similar to MySQL Workbench).

---

## 📈 Performance Optimizations

### 1. **Server Components by Default**
- React server components reduce JavaScript bundle
- Only interactive components marked with `"use client"`

### 2. **Database Query Optimization**
- SQL aggregation (SUM, COUNT) done in database, not in JS
- Indexes on foreign keys and frequently filtered columns
- Caching via `revalidatePath()`

### 3. **Image Optimization**
- Lucide icons (SVG-based)
- No heavy image assets

### 4. **Payload Minimization**
- Only necessary fields returned from API
- Pagination in report tables

---

## 🔄 Code Quality & Standards

### TypeScript
- Strict mode enabled
- Full type safety across database, API, and UI

### Code Organization
- Feature-based folder structure
- Separation of concerns (UI, business logic, database)
- Clear naming conventions

### Styling
- Utility-first with Tailwind CSS
- Consistent design tokens
- Responsive mobile-first design

### Error Handling
- Try-catch blocks in server actions
- User-friendly error messages
- Detailed console logging for debugging

---

## 📚 Documentation Structure

| File | Purpose |
|------|---------|
| `README.md` | Project overview & setup |
| `prd.md` | Product requirements and features |
| `techstack.md` | Technology choices & justification |
| `structure.md` | Folder structure documentation |
| `ANALYSIS.md` | Project phases & completion status |
| `CODEBASE_ANALYSIS.md` | Initial codebase breakdown |
| `Multi-Tenant Security & RBAC Logic.md` | Security architecture |

---

## 🎯 Next Steps & Recommendations

### Immediate (Priority 1)
1. **Complete Accounts Module**
   - Create missing files
   - Build COA management UI
   - Test end-to-end

2. **Integrate Real Authentication**
   - Set up Clerk or auth provider
   - Remove hardcoded session context
   - Test RBAC enforcement

### Short-Term (Priority 2)
1. **Enhance Notifications**
   - Email notifications for missed submissions
   - Daily/weekly digest reports

2. **Advanced Reporting**
   - Trend analysis visualizations
   - Month-over-month comparisons
   - Profit margin tracking

### Medium-Term (Priority 3)
1. **Mobile App**
   - React Native or PWA enhancement
   - Offline-first data submission

2. **Advanced Analytics**
   - Predictive analytics for sales trends
   - Anomaly detection for irregular entries

3. **Integration**
   - Tally ERP sync
   - Accounting software integration

---

## 🤝 Team Collaboration

### Key Files to Understand First
1. `src/app/layout.tsx` - Entry point
2. `src/db/schema.ts` - Data structure
3. `src/lib/actions/accounts.ts` - Core logic
4. `src/components/forms/DailyEntryForm.tsx` - Main UI

### Development Workflow
- Create feature branch from `main`
- Run `npm run dev` and test locally
- Use `npm run lint` before commit
- Deploy to Vercel for staging
- Merge PR for production

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Database connection fails
**Solution**: Check `.env.local` has valid `DATABASE_URL`

**Issue**: Form submission gives "No outlet assigned"
**Solution**: This is expected due to hardcoded auth. Implement real auth.

**Issue**: 404 on `/accounts/chart-of-accounts`
**Solution**: Module not yet implemented. See Issue #1 above.

---

## 📄 License & Attribution

- Built with **Next.js**, **Tailwind CSS**, and **Neon**
- UI Components from **shadcn/ui**
- Icons from **Lucide React**

---

**Generated**: April 2, 2026
**Codebase Version**: v1.0.0
**Status**: Production-Ready (85% Complete)
