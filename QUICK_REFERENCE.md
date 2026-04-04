# Quick Reference — Sahakar Daily Accounts (DOAMS)

**Production:** https://doams.vercel.app
**Last Updated:** 2026-04-03

---

## Setup & Run

```bash
npm install
# Create .env.local — see Environment Variables section below
npm run db:push      # Push schema to Supabase
npm run db:seed      # Seed 14 outlets + 420 dummy entries
npm run dev          # http://localhost:3000
```

---

## Scripts

```bash
npm run dev           # Dev server (Turbopack, instant HMR)
npm run build         # Production build
npm run lint          # ESLint
npm run db:push       # Sync Drizzle schema → Supabase (uses DIRECT_URL)
npm run db:generate   # Generate Drizzle migration files
npm run db:studio     # Drizzle Studio at http://localhost:5173
npm run db:seed       # Seed database
npm run format        # Prettier format
```

---

## Environment Variables

```env
# .env.local
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`DATABASE_URL` — Transaction Pooler port 6543 — used by app at runtime
`DIRECT_URL` — Direct port 5432 — used by drizzle-kit only
`SUPABASE_SERVICE_ROLE_KEY` — **never expose to client**, server-side only

---

## Where to Find Things

| Task | File |
|---|---|
| Route protection / auth redirect | `src/proxy.ts` |
| RBAC permission matrix | `src/lib/permissions.ts` |
| Database schema (12 tables) | `src/db/schema.ts` |
| Daily entry logic | `src/lib/actions/accounts.ts` |
| User CRUD (admin only) | `src/lib/actions/users.ts` |
| Registration approval (admin only) | `src/lib/actions/registrations.ts` |
| Audit logging helper | `src/lib/actions/audit.ts` |
| Zod entry validation | `src/lib/validations/entry.ts` |
| PDF export | `src/lib/export.ts` |
| Supabase browser client | `src/lib/supabase/client.ts` |
| Supabase server client | `src/lib/supabase/server.ts` |
| Main entry form | `src/components/forms/DailyEntryForm.tsx` |
| User list + inline edit | `src/components/admin/UsersList.tsx` |
| PWA install + notification banner | `src/components/shared/PWAPrompt.tsx` |
| Service worker | `public/sw.js` |
| PWA manifest | `public/manifest.json` |

---

## Roles & Access

```
ADMIN
  ✅ Full access
  ✅ Create / edit / delete users
  ✅ Approve / reject registration requests
  ✅ All outlets, all reports
  ✅ Staff nav link

HO ACCOUNTANT
  ✅ All outlets, all reports
  ✅ Edit all entries
  ✅ View users (read-only, no edit/delete/approve)
  ✅ Staff nav link
  ❌ Cannot manage users

OUTLET MANAGER / ACCOUNTANT
  ✅ Own outlet only
  ✅ Create / edit own entries
  ✅ Own reports + export
  ❌ No Staff nav link
  ❌ Redirected away from /admin/users and /admin/overview
```

---

## Auth Flow

| Action | How |
|---|---|
| Sign in | `supabase.auth.signInWithPassword()` |
| Magic link | `supabase.auth.signInWithOtp()` |
| Forgot password | `supabase.auth.resetPasswordForEmail()` → email → `/update-password` |
| Change password | `supabase.auth.updateUser({ password })` |
| Sign out | `supabase.auth.signOut()` |
| Register | `/register` → admin approves → `admin.createUser()` |

---

## Features Status

| Feature | Status |
|---|---|
| Daily entry form + tally validation | ✅ |
| Overwrite confirmation | ✅ |
| User management (admin) | ✅ |
| Registration request flow | ✅ |
| RBAC enforcement (all layers) | ✅ |
| All/own reports + PDF export | ✅ |
| Outlet pages | ✅ |
| Audit logging | ✅ |
| Forgot password / reset flow | ✅ |
| PWA install prompt | ✅ |
| Browser push notifications | ✅ (local; server push pending) |
| Settings (profile, password, notifications) | ✅ |
| Error boundaries | ✅ |
| Report loading skeletons | ✅ |
| Chart of Accounts UI | ⚠️ Partial |
| Advanced analytics / charts | ❌ Pending |
| Email alerts for missed entries | ❌ Pending |

---

## Common Tasks

### Add a new protected page
```typescript
// src/app/newpage/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // render...
}
```

### Add a new server action with role check
```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function myAdminAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const [caller] = await db.select({ role: users.role })
    .from(users).where(eq(users.id, user.id)).limit(1);
  if (!caller || caller.role !== "admin")
    return { success: false, error: "Forbidden" };
  // proceed...
}
```

### Add a new database table
```typescript
// 1. Edit src/db/schema.ts
export const newTable = pgTable("new_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Push to Supabase
// npm run db:push
```

---

## Troubleshoot

| Problem | Fix |
|---|---|
| "Too many connections" | Ensure DATABASE_URL uses port 6543 (pooler), not 5432 |
| `prepare: false` error | Already set in `src/db/index.ts` — do not remove |
| Auth email not arriving | Check Brevo logs at app.brevo.com; verify sender `frpboy12@gmail.com` |
| Build error: `runtime` in proxy.ts | Remove `export const runtime` — proxy.ts always Node.js, export is rejected |
| Outlet user sees all outlets | Check `canAccessAllOutlets(role)` in `src/app/entry/page.tsx` |
