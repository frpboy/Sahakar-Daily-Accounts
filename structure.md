# DOAMS File Structure

## Full File Tree

```
Sahakar-Daily-Accounts/
├── public/
│   ├── manifest.json           # PWA manifest (icons, start_url, display: standalone)
│   ├── sw.js                   # Service worker (push + notificationclick)
│   └── icons/
│       ├── icon-192x192.png
│       └── icon-512x512.png
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── overview/
│   │   │   │   └── page.tsx    # Consolidated admin dashboard (admin + ho_accountant only)
│   │   │   ├── settings/
│   │   │   │   └── page.tsx    # Profile, Change Password, Notifications tabs
│   │   │   └── users/
│   │   │       └── page.tsx    # User management (admin) / read-only list (ho_accountant)
│   │   ├── api/
│   │   │   ├── auth/callback/
│   │   │   │   └── route.ts    # Supabase PKCE code exchange
│   │   │   ├── all-reports/
│   │   │   │   └── route.ts    # All outlet reports with filters
│   │   │   ├── dashboard-stats/
│   │   │   │   └── route.ts    # Dashboard KPI aggregates
│   │   │   ├── notifications/
│   │   │   │   └── route.ts    # User notifications
│   │   │   ├── outlets/
│   │   │   │   └── route.ts    # Create outlet (POST)
│   │   │   ├── outlets-list/
│   │   │   │   └── route.ts    # List all outlets (GET)
│   │   │   ├── outlets-stats/
│   │   │   │   └── route.ts    # Per-outlet stats
│   │   │   ├── own-reports/
│   │   │   │   └── route.ts    # Outlet-scoped reports
│   │   │   └── registration-requests/
│   │   │       └── route.ts    # Public registration POST endpoint
│   │   ├── accounts/
│   │   │   └── chart-of-accounts/
│   │   │       └── page.tsx    # Chart of Accounts (partial)
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Main dashboard
│   │   ├── entry/
│   │   │   ├── page.tsx        # Daily entry form (server component, RBAC-aware)
│   │   │   └── error.tsx       # Error boundary
│   │   ├── login/
│   │   │   └── page.tsx        # Login (password / magic link / forgot password)
│   │   ├── outlets/
│   │   │   ├── page.tsx        # All outlets grid
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Single outlet detail
│   │   ├── register/
│   │   │   └── page.tsx        # Registration request form
│   │   ├── reports/
│   │   │   ├── page.tsx        # All reports (admin/ho)
│   │   │   ├── error.tsx       # Error boundary
│   │   │   └── own/
│   │   │       └── page.tsx    # Own outlet reports
│   │   ├── update-password/
│   │   │   └── page.tsx        # Set new password after reset link
│   │   ├── globals.css
│   │   ├── layout.tsx          # Root layout (Geist font, manifest, ClientLayout)
│   │   └── page.tsx            # Root redirect → /dashboard
│   ├── components/
│   │   ├── admin/
│   │   │   ├── UsersList.tsx           # User list with inline edit/delete (isAdmin prop)
│   │   │   └── RegistrationRequestsList.tsx  # Pending registration approvals
│   │   ├── forms/
│   │   │   ├── DailyEntryForm.tsx      # Entry form with tally + overwrite detection
│   │   │   └── UserForm.tsx            # User create/edit form
│   │   ├── settings/
│   │   │   ├── SettingsPages.tsx       # PersonalProfile, SecuritySettings components
│   │   │   └── NotificationSettings.tsx # Push notification permission management
│   │   ├── shared/
│   │   │   ├── ClientLayout.tsx        # Root client wrapper (TopNav, Toaster, PWAPrompt)
│   │   │   ├── DateRangeFilter.tsx     # Reusable date range picker
│   │   │   ├── PWAPrompt.tsx           # Install banner + notification permission banner
│   │   │   └── TopNav.tsx              # Navigation bar (role-aware links)
│   │   ├── tables/
│   │   │   └── AccountsDataTable.tsx   # Reports table with sort/filter/export
│   │   └── ui/                         # shadcn/ui components
│   ├── db/
│   │   ├── schema.ts           # 12-table Drizzle schema
│   │   ├── index.ts            # postgres.js + Drizzle client (prepare: false)
│   │   └── seed.ts             # Seed 14 outlets + 420 entries
│   ├── lib/
│   │   ├── actions/
│   │   │   ├── accounts.ts     # submitDailyAccount (upsert + audit log)
│   │   │   ├── audit.ts        # logAudit() — writes to audit_logs, never throws
│   │   │   ├── coa.ts          # Chart of Accounts server actions
│   │   │   ├── registrations.ts # submit / approve (admin only) / reject (admin only)
│   │   │   └── users.ts        # createUser / updateUser / deleteUser (admin only)
│   │   ├── supabase/
│   │   │   ├── client.ts       # createBrowserClient() for client components
│   │   │   └── server.ts       # createServerClient() (async) for server actions
│   │   ├── export.ts           # jsPDF A4 landscape export
│   │   ├── permissions.ts      # ROLE_PERMISSIONS map + hasPermission() + canAccessAllOutlets()
│   │   ├── utils.ts            # cn(), formatCurrency(), formatDate()
│   │   └── validations/
│   │       └── entry.ts        # Zod schema for daily entry form
│   ├── types/
│   │   └── supabase.ts         # Generated Supabase TypeScript types
│   └── proxy.ts                # Next.js 16 routing middleware (route protection)
├── drizzle.config.ts           # Drizzle config (uses DIRECT_URL)
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json
└── package.json
```

---

## Key Patterns

### Server Component Data Fetch
```typescript
// app/entry/page.tsx
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canAccessAllOutlets } from "@/lib/permissions";

export default async function EntryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [dbUser] = await db.select().from(users).where(eq(users.id, user!.id)).limit(1);
  const isAdmin = canAccessAllOutlets(dbUser.role!);
  // ...
}
```

### Server Action with Role Check
```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function adminOnlyAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const [caller] = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!caller || caller.role !== "admin") return { success: false, error: "Forbidden" };
  // proceed...
}
```

### Audit Logging
```typescript
import { logAudit } from "@/lib/actions/audit";

await logAudit({
  userId: authUser.id,
  action: "create" | "update" | "delete",
  entityType: "daily_account" | "user" | "registration_request",
  entityId: recordId,
  oldData: previousRecord,   // optional JSONB
  newData: updatedRecord,    // optional JSONB
});
```
