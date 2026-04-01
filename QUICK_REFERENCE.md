# 🔍 Quick Reference Guide - Sahakar Daily Accounts

## 🚀 Get Started in 5 Minutes

### 1. **Setup & Run**
```bash
# Clone and install dependencies
npm install

# Setup environment (copy .env.example to .env.local)
cp .env.example .env.local

# Start development server
npm run dev
# Open http://localhost:3000
```

### 2. **Key Shortcuts**
```bash
npm run dev          # Start dev server (Turbopack, instant HMR)
npm run build        # Production build
npm run db:push      # Sync schema to Neon
npm run db:seed      # Populate test data
npm run db:studio    # Open visual DB editor
npm run lint         # Check code quality
npm run format       # Auto-format code
```

---

## 📊 Architecture at a Glance

```
Next.js 15 (Frontend)
    ↓
Server Actions (Backend Logic)
    ↓
Neon PostgreSQL (Database)
```

**No separate API needed!** Server Actions handle all backend operations.

---

## 🗂️ Where to Find Things

| Need to... | Look in... | File/Path |
|-----------|-----------|----------|
| Add a new page | `src/app/` | Create `page.tsx` |
| Create a form | `src/components/forms/` | Example: `DailyEntryForm.tsx` |
| Add validation | `src/lib/validations/` | Use Zod schemas |
| Handle data operations | `src/lib/actions/` | Server Actions |
| Query database | `src/db/` | Drizzle ORM |
| Define tables | `src/db/schema.ts` | Full schema definition |
| Style components | `globals.css` | Tailwind utilities |
| Manage auth | `src/lib/auth-utils.ts` | **Currently hardcoded! ⚠️** |
| Check permissions | `src/lib/permissions.ts` | RBAC logic |

---

## 🎯 Main Features at a Glance

| Feature | Status | File(s) |
|---------|--------|---------|
| Daily Entry Form | ✅ Working | `DailyEntryForm.tsx` |
| Admin Dashboard | ✅ Working | `AdminView.tsx` |
| Reports & Export | ✅ Working | `AccountsDataTable.tsx` |
| Outlet Management | ✅ Working | `/outlets/*` |
| RBAC Permissions | ✅ Defined | `permissions.ts` |
| Audit Logging | ✅ Implemented | `audit.ts` |
| Chart of Accounts | ❌ Missing | `/accounts/* (not created)` |
| Real Authentication | ❌ Disabled | `auth-utils.ts` |

---

## 🔑 Critical Code Locations

### Database Schema
```typescript
// src/db/schema.ts
export const outlets              // Retail locations
export const users                // User authentication
export const dailyAccounts        // Core financial data
export const chartOfAccounts      // Enterprise accounting
```

### Main Form Logic
```typescript
// src/components/forms/DailyEntryForm.tsx
- Real-time payment validation (Cash + UPI + Credit = Total)
- Auto-calculated profit margins
- Mobile-optimized inputs
```

### Form Submission
```typescript
// src/lib/actions/accounts.ts
export async function submitDailyAccount(rawData)
- Validates with Zod
- Performs UPSERT to prevent duplicates
- Logs audit trail
- Sends notifications
```

### Dashboard Stats
```typescript
// src/app/api/dashboard-stats/route.ts
- Aggregates sales, expenses across outlets/dates
- Returns outlet submission status
- Calculates KPIs (total sales, total expenses)
```

---

## 🔐 User Roles & Permissions

```
┌─────────────────────────────────────────────────┐
│ ADMIN                                           │
│ - Full system access                            │
│ - Can view all outlets                          │
│ - Can edit any entry                            │
│ - User management                               │
│ - Account management                            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ HO ACCOUNTANT (Head Office)                     │
│ - View all outlets                              │
│ - Edit all entries                              │
│ - View reports                                  │
│ - Cannot manage users                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ OUTLET MANAGER / ACCOUNTANT                     │
│ - View own outlet only                          │
│ - Create/edit own entries                       │
│ - Export own reports                            │
└─────────────────────────────────────────────────┘
```

**Where it's coded:** `src/lib/permissions.ts`

---

## 📱 UI Components Quick Reference

### shadcn/ui Components Used
- `Button` - All action buttons
- `Card` - Dashboard cards
- `Form` - Form wrapper with RHF integration
- `Input` - Text/number inputs
- `Select` - Dropdown selectors
- `Dialog` - Modals (outlet creation)
- `DropdownMenu` - More actions
- `Table` - Data tables with TanStack Table
- `Label` - Form labels
- `ScrollArea` - Scrollable containers

**Location:** `src/components/ui/`

### Custom Components
- `DailyEntryForm` - Main data entry form
- `AccountsDataTable` - Reports table with sorting/filtering
- `AdminView/OutletManagerView` - Role-specific dashboards
- `DateRangeFilter` - Date picker utility
- `TopNav` - Header navigation
- `MobileNav` - Mobile bottom nav

---

## 🔄 Data Flow Examples

### Example 1: Submitting a Daily Entry

```
User fills form in DailyEntryForm
    ↓
Form sends data to submitDailyAccount() Server Action
    ↓
Zod validates: dates, amounts, outlet ID
    ↓
Database UPSERT (insert if new, update if exists)
    ↓
Audit log created (who, what, when)
    ↓
Toast notification shown to user
    ↓
Cache invalidated via revalidatePath()
    ↓
Dashboard automatically refreshes
```

### Example 2: Viewing Dashboard Stats

```
Page loads AdminView component
    ↓
AdminView useEffect() calls /api/dashboard-stats
    ↓
API route aggregates data from database:
    - SUM(saleCash + saleUpi + saleCredit) as totalSales
    - SUM(expenses) as totalExpenses
    - COUNT outlets that submitted today
    ↓
Returns JSON response
    ↓
Dashboard renders cards with numbers
```

---

## ⚙️ Environment Variables

```bash
# Required for local development
DATABASE_URL=postgresql://user:pass@region.neon.tech/dbname?sslmode=require

# For future authentication (when implementing)
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
# CLERK_SECRET_KEY=...
```

---

## 🚨 Known Issues

| Issue | Status | Workaround |
|-------|--------|-----------|
| **Accounts module missing** | ❌ Not Implemented | Routes `/accounts/*` return 404 |
| **Auth is hardcoded** | ⚠️ For dev only | All users logged in as admin |
| **No email notifications** | ⚠️ Toast only | Notifications are UI-only |

---

## 💡 Common Tasks

### Add a New Page
```typescript
// 1. Create file
src/app/newfeature/page.tsx

// 2. Make it a server component
export default function NewFeaturePage() {
  return <div>Content</div>
}

// 3. If it needs auth, wrap with ProtectedRoute
```

### Add a New Database Table
```typescript
// 1. Edit src/db/schema.ts
export const newTable = pgTable("new_table", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
})

// 2. Generate migration
npm run db:generate

// 3. Push to Neon
npm run db:push
```

### Handle a Form Submission
```typescript
// 1. Create Zod schema
import { z } from "zod"
const mySchema = z.object({ field: z.string() })

// 2. Create Server Action
"use server"
export async function submitForm(data: unknown) {
  const validated = mySchema.parse(data)
  // Save to database
  // Return success/error
}

// 3. Bind to form in client component
<form action={submitForm}>
  {/* inputs */}
</form>
```

### Query the Database
```typescript
// Always in Server Actions or API routes
import { db } from "@/db"
import { outlets } from "@/db/schema"
import { eq } from "drizzle-orm"

const result = await db
  .select()
  .from(outlets)
  .where(eq(outlets.id, outletId))
```

---

## 🔧 Debug & Troubleshoot

### Check Database Direct­ly
```bash
npm run db:studio
# Opens visual editor at http://localhost:5173
```

### View Server Action Errors
```typescript
// Check browser console and terminal for:
- Zod validation errors
- Database constraint violations
- Async function errors
```

### Test a Specific Route
```bash
# Visit directly
http://localhost:3000/entry
http://localhost:3000/reports
http://localhost:3000/admin/overview
```

---

## 📦 Deployment

### Deploy to Vercel
```bash
# Push to main branch on GitHub
git push origin main

# Vercel automatically deploys
# Check vercel.json for build config
```

### Environment Variables on Vercel
1. Go to Vercel Project Settings
2. Add Environment Variables
3. Set `DATABASE_URL` to your Neon connection string
4. Redeploy

---

## 📚 Learn More

- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zod Validation](https://zod.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Neon Docs](https://neon.tech/docs)

---

## 🎯 Next Steps for Developers

1. **Read** `FULL_CODEBASE_ANALYSIS.md` for deep dive
2. **Run** `npm run dev` and explore locally
3. **Read** `src/db/schema.ts` to understand database
4. **Study** `src/lib/actions/accounts.ts` for main logic
5. **Review** `src/components/forms/DailyEntryForm.tsx` for UI
6. **Checkout** `.env.example` for required env vars

---

**Last Updated**: April 2, 2026
**Maintainer**: Copilot Assistant
**Status**: Ready for Development ✅
