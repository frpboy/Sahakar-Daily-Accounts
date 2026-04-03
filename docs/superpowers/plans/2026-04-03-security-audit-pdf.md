# Security, Auth & PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add root middleware route protection, real user-role-based permissions in the entry page, audit logging on all mutating server actions, and production-grade PDF export via jsPDF.

**Architecture:** Middleware wraps all requests at the Next.js edge — unauthenticated users are redirected to `/login`, authenticated users are redirected away from `/login`/`/register`. The entry page is refactored from a client-side fetch to a server component that reads role from DB and passes it down. A single `logAudit()` helper in `src/lib/actions/audit.ts` is called after every DB mutation. `jspdf` + `jspdf-autotable` replace the browser-print PDF fallback.

**Tech Stack:** Next.js 16 App Router, Supabase SSR (@supabase/ssr), Drizzle ORM, jsPDF, jsPDF-AutoTable, TypeScript

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/middleware.ts` | **Create** | Root Next.js middleware — session refresh + route protection |
| `src/app/entry/page.tsx` | **Modify** | Convert to Server Component; derive `canSeeAllOutlets` from DB user |
| `src/types/supabase.ts` | **Create** | Supabase generated TypeScript types |
| `src/lib/actions/audit.ts` | **Create** | `logAudit()` helper that writes to `audit_logs` table |
| `src/lib/actions/accounts.ts` | **Modify** | Call `logAudit()` after `submitDailyAccount` upsert |
| `src/lib/actions/users.ts` | **Modify** | Call `logAudit()` after create/update/delete/approve/reject |
| `src/lib/export.ts` | **Modify** | Replace `exportToPDF` browser-print with jsPDF |

---

## Task 1: Root Middleware — Session Refresh + Route Protection

**Files:**
- Create: `src/middleware.ts`

**Context:**
- `src/lib/supabase/middleware.ts` exports `updateSession(request)` which returns `{ supabaseResponse, user }`
- Protected routes: everything except `/login`, `/register`, `/api/auth/callback`, and Next.js internals (`/_next/`, `/favicon.ico`)
- Unauthenticated users hitting a protected route → redirect to `/login`
- Authenticated users hitting `/login` or `/register` → redirect to `/dashboard`

- [ ] **Step 1: Create `src/middleware.ts`**

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth/callback"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return supabaseResponse;
  }

  // Authenticated user trying to access /login or /register → send to dashboard
  if (user && isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Unauthenticated user trying to access a protected route → send to login
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Verify dev server starts without errors**

```bash
cd e:/K4NN4N/Sahakar-Daily-Accounts && npm run dev
```

Expected: Server starts, no TypeScript errors in middleware.

- [ ] **Step 3: Manual smoke test**

Open an incognito window and navigate to `http://localhost:3000/dashboard`. Expected: redirected to `/login`. Log in, then navigate to `http://localhost:3000/login`. Expected: redirected to `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add root middleware for session refresh and route protection"
```

---

## Task 2: Generate Supabase TypeScript Types

**Files:**
- Create: `src/types/supabase.ts`

**Context:**
- Supabase project ID is `grdeedwkzqyfxgfeskdr` (from `.env.local`)
- Requires Supabase CLI: `npx supabase`
- The file is currently empty — just needs the generated types

- [ ] **Step 1: Generate types using Supabase CLI**

```bash
cd e:/K4NN4N/Sahakar-Daily-Accounts && npx supabase gen types typescript --project-id grdeedwkzqyfxgfeskdr > src/types/supabase.ts
```

Expected: `src/types/supabase.ts` is populated with `Database`, `Tables`, `Enums` type definitions.

If the CLI requires login first:
```bash
npx supabase login
# Then re-run the gen command above
```

- [ ] **Step 2: Verify file is non-empty**

```bash
head -20 src/types/supabase.ts
```

Expected: Output shows `export type Json = ...` and `export type Database = { public: { Tables: { ... } } }`.

- [ ] **Step 3: Commit**

```bash
git add src/types/supabase.ts
git commit -m "feat: add generated Supabase TypeScript types"
```

---

## Task 3: Fix Hardcoded Permission in Entry Page

**Files:**
- Modify: `src/app/entry/page.tsx`

**Context:**
- Current: `const canSeeAllOutlets = true` — always treats every user as admin
- Fix: Convert to Server Component, read user from Supabase + DB, derive `canSeeAllOutlets` using `canAccessAllOutlets(role)` from `src/lib/permissions.ts`
- `canAccessAllOutlets(role)` returns `true` for `admin` and `ho_accountant` only
- For outlet-level users, `defaultOutletId` should be set to their `outletId` so the form pre-selects their outlet
- The outlet list for outlet-level users should only contain their own outlet (no point fetching all outlets)
- `DailyEntryForm` is a client component and keeps its `"use client"` directive — the page wrapper becomes a server component

- [ ] **Step 1: Replace `src/app/entry/page.tsx` entirely**

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, outlets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canAccessAllOutlets } from "@/lib/permissions";
import { DailyEntryForm } from "@/components/forms/DailyEntryForm";
import { Container } from "@/components/ui/container";

export default async function EntryPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!dbUser) redirect("/login");

  const isAdmin = canAccessAllOutlets(dbUser.role!);

  let outletList: { id: string; name: string }[];

  if (isAdmin) {
    outletList = await db
      .select({ id: outlets.id, name: outlets.name })
      .from(outlets)
      .orderBy(outlets.name);
  } else {
    if (!dbUser.outletId) {
      return (
        <Container className="py-8">
          <p className="text-center text-red-500">
            No outlet assigned. Please contact your administrator.
          </p>
        </Container>
      );
    }
    outletList = await db
      .select({ id: outlets.id, name: outlets.name })
      .from(outlets)
      .where(eq(outlets.id, dbUser.outletId));
  }

  return (
    <Container className="py-8">
      <div className="max-w-3xl mx-auto">
        <DailyEntryForm
          outlets={outletList}
          defaultOutletId={dbUser.outletId ?? undefined}
          isAdmin={isAdmin}
        />
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd e:/K4NN4N/Sahakar-Daily-Accounts && npx tsc --noEmit
```

Expected: No errors in `src/app/entry/page.tsx`.

- [ ] **Step 3: Manual test — outlet_manager user**

Log in as an outlet_manager. Navigate to `/entry`. Expected: Outlet selector shows only their own outlet, cannot switch.

- [ ] **Step 4: Manual test — admin user**

Log in as admin. Navigate to `/entry`. Expected: Outlet selector shows all outlets.

- [ ] **Step 5: Commit**

```bash
git add src/app/entry/page.tsx
git commit -m "fix: derive entry page outlet permissions from actual user role"
```

---

## Task 4: Audit Logging Helper

**Files:**
- Create: `src/lib/actions/audit.ts`

**Context:**
- `audit_logs` schema (from `src/db/schema.ts`):
  - `userId: text`, `userName: text`, `action: text` (required), `entityType: text` (required), `entityId: text`, `oldData: jsonb`, `newData: jsonb`, `ipAddress: text`, `createdAt: timestamp`
- The helper must be a server-only function (called from other server actions)
- It should not throw on failure — audit log failures must never break the main operation
- `action` values: `"create"`, `"update"`, `"delete"`, `"approve"`, `"reject"`
- `entityType` values: `"daily_account"`, `"user"`, `"registration_request"`

- [ ] **Step 1: Create `src/lib/actions/audit.ts`**

```typescript
"use server";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export interface AuditParams {
  userId: string;
  userName?: string;
  action: "create" | "update" | "delete" | "approve" | "reject";
  entityType: "daily_account" | "user" | "registration_request";
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      userName: params.userName ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      oldData: params.oldData ?? null,
      newData: params.newData ?? null,
    });
  } catch (err) {
    // Audit log failure must never crash the calling action
    console.error("[audit] Failed to write audit log:", err);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd e:/K4NN4N/Sahakar-Daily-Accounts && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/audit.ts
git commit -m "feat: add logAudit helper for writing to audit_logs table"
```

---

## Task 5: Wire Audit Logging into `accounts.ts`

**Files:**
- Modify: `src/lib/actions/accounts.ts`

**Context:**
- `submitDailyAccount` does an upsert — log `"create"` for inserts and `"update"` for updates
- The upsert uses `onConflictDoUpdate` — to distinguish create vs update, query for an existing record before the upsert
- Log `entityType: "daily_account"` with `entityId` set to `outletId + ":" + dateStr` (composite — no single ID before insert)
- `oldData` on update: the existing record fields; `null` on create
- `newData`: the validated form fields

- [ ] **Step 1: Modify `src/lib/actions/accounts.ts`**

Add `import { logAudit } from "@/lib/actions/audit";` at the top.

Replace the section in `submitDailyAccount` between steps 5 and 6 (after outlet verification, before the DB upsert) with:

```typescript
    // 5a. Check if record already exists (to determine create vs update for audit)
    const existing = await db
      .select()
      .from(dailyAccounts)
      .where(
        and(
          eq(dailyAccounts.outletId, targetOutletId),
          eq(dailyAccounts.date, dateStr)
        )
      )
      .limit(1);

    const isUpdate = existing.length > 0;
```

After the upsert (after line `updatedAt: new Date(),`), before `revalidatePath` calls, add:

```typescript
    // Audit log
    await logAudit({
      userId,
      userName: dbUser.name,
      action: isUpdate ? "update" : "create",
      entityType: "daily_account",
      entityId: `${targetOutletId}:${dateStr}`,
      oldData: isUpdate ? (existing[0] as Record<string, unknown>) : undefined,
      newData: {
        outletId: targetOutletId,
        date: dateStr,
        saleCash: validatedData.saleCash,
        saleUpi: validatedData.saleUpi,
        saleCredit: validatedData.saleCredit,
        saleReturn: validatedData.saleReturn,
        expenses: validatedData.expenses,
        purchase: validatedData.purchase,
        closingStock: validatedData.closingStock,
      },
    });
```

The full modified `submitDailyAccount` after changes:

```typescript
"use server";

import { db } from "@/db";
import { dailyAccounts, outlets, users } from "@/db/schema";
import { dailyEntrySchema } from "@/lib/validations/entry";
import { revalidatePath } from "next/cache";
import { eq, and, between, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/actions/audit";

export async function submitDailyAccount(rawData: unknown) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "Unauthorized" };

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);
    if (!dbUser) return { success: false, error: "User not found" };

    const userId = dbUser.id;
    const outletId = dbUser.outletId ?? undefined;
    const isAdmin = dbUser.role === "admin" || dbUser.role === "ho_accountant";

    const validatedData = dailyEntrySchema.parse(rawData);
    const targetOutletId = isAdmin ? validatedData.outletId : outletId;

    if (!targetOutletId) {
      return { success: false, error: "No outlet assigned to user." };
    }

    const outletExists = await db
      .select()
      .from(outlets)
      .where(eq(outlets.id, targetOutletId))
      .limit(1);

    if (outletExists.length === 0) {
      return { success: false, error: "Invalid outlet selected." };
    }

    const dateStr = validatedData.date.toISOString().split("T")[0];

    // Determine create vs update for audit
    const existing = await db
      .select()
      .from(dailyAccounts)
      .where(
        and(
          eq(dailyAccounts.outletId, targetOutletId),
          eq(dailyAccounts.date, dateStr)
        )
      )
      .limit(1);

    const isUpdate = existing.length > 0;

    await db
      .insert(dailyAccounts)
      .values({
        date: dateStr,
        outletId: targetOutletId,
        saleCash: validatedData.saleCash.toString(),
        saleUpi: validatedData.saleUpi.toString(),
        saleCredit: validatedData.saleCredit.toString(),
        saleReturn: validatedData.saleReturn.toString(),
        expenses: validatedData.expenses.toString(),
        purchase: validatedData.purchase.toString(),
        closingStock: validatedData.closingStock.toString(),
        createdBy: userId,
      })
      .onConflictDoUpdate({
        target: [dailyAccounts.date, dailyAccounts.outletId],
        set: {
          saleCash: validatedData.saleCash.toString(),
          saleUpi: validatedData.saleUpi.toString(),
          saleCredit: validatedData.saleCredit.toString(),
          saleReturn: validatedData.saleReturn.toString(),
          expenses: validatedData.expenses.toString(),
          purchase: validatedData.purchase.toString(),
          closingStock: validatedData.closingStock.toString(),
          updatedAt: new Date(),
        },
      });

    await logAudit({
      userId,
      userName: dbUser.name,
      action: isUpdate ? "update" : "create",
      entityType: "daily_account",
      entityId: `${targetOutletId}:${dateStr}`,
      oldData: isUpdate ? (existing[0] as Record<string, unknown>) : undefined,
      newData: {
        outletId: targetOutletId,
        date: dateStr,
        saleCash: validatedData.saleCash,
        saleUpi: validatedData.saleUpi,
        saleCredit: validatedData.saleCredit,
        saleReturn: validatedData.saleReturn,
        expenses: validatedData.expenses,
        purchase: validatedData.purchase,
        closingStock: validatedData.closingStock,
      },
    });

    revalidatePath("/entry");
    revalidatePath("/reports");
    revalidatePath("/dashboard");

    return { success: true, message: "Entry saved successfully!" };
  } catch (error: any) {
    console.error("Submission Error:", error);
    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors.map((e: any) => e.message).join(", "),
      };
    }
    return { success: false, error: "Database error. Please try again later." };
  }
}
```

(Keep all other functions in `accounts.ts` — `getDailyEntries`, `getDailyEntriesForLastDays`, `getAllOutlets`, `getMonthlyAggregates` — unchanged.)

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd e:/K4NN4N/Sahakar-Daily-Accounts && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/accounts.ts
git commit -m "feat: audit log daily account create/update in submitDailyAccount"
```

---

## Task 6: Wire Audit Logging into `users.ts`

**Files:**
- Modify: `src/lib/actions/users.ts`

**Context:** Read the full file first (`src/lib/actions/users.ts`) to see exact function signatures. Add `logAudit` calls after the DB mutation in each of: `createUser`, `updateUser`, `deleteUser`, `approveRequest`, `rejectRequest`. The calling user ID must come from Supabase auth (`supabase.auth.getUser()`). Each function already has its own auth check — add `logAudit` right before the `return { success: true }`.

- [ ] **Step 1: Read `src/lib/actions/users.ts` to get exact current code**

Read: `src/lib/actions/users.ts`

- [ ] **Step 2: Add `logAudit` import at top of `users.ts`**

```typescript
import { logAudit } from "@/lib/actions/audit";
```

- [ ] **Step 3: Add audit call in `createUser` — right before `return { success: true }`**

```typescript
    await logAudit({
      userId: authUser.id,
      action: "create",
      entityType: "user",
      entityId: data.id,
      newData: data as Record<string, unknown>,
    });
```

- [ ] **Step 4: Add audit call in `updateUser` — capture old data before update, log after**

Before the update query, add:
```typescript
    const [oldUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);
```

After the update query, before `return { success: true }`:
```typescript
    await logAudit({
      userId: authUser.id,
      action: "update",
      entityType: "user",
      entityId: id,
      oldData: oldUser as Record<string, unknown>,
      newData: data as Record<string, unknown>,
    });
```

- [ ] **Step 5: Add audit call in `deleteUser` — capture old data before delete, log after**

Before the delete query, add:
```typescript
    const [deletedUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);
```

After the delete query, before `return { success: true }`:
```typescript
    await logAudit({
      userId: authUser.id,
      action: "delete",
      entityType: "user",
      entityId: id,
      oldData: deletedUser as Record<string, unknown>,
    });
```

- [ ] **Step 6: Add audit call in `approveRequest` — after user creation, before return**

```typescript
    await logAudit({
      userId: authUser.id,
      action: "approve",
      entityType: "registration_request",
      entityId: requestId,
    });
```

- [ ] **Step 7: Add audit call in `rejectRequest` — before return**

```typescript
    await logAudit({
      userId: authUser.id,
      action: "reject",
      entityType: "registration_request",
      entityId: requestId,
    });
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd e:/K4NN4N/Sahakar-Daily-Accounts && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add src/lib/actions/users.ts
git commit -m "feat: audit log user create/update/delete and registration approve/reject"
```

---

## Task 7: Production PDF Export with jsPDF

**Files:**
- Modify: `src/lib/export.ts`

**Context:**
- Current `exportToPDF` opens a new browser window and calls `window.print()` — not production-grade
- Replace with `jspdf` + `jspdf-autotable`
- The function signature stays the same: `exportToPDF(elementId: string, filename: string)`
- `jspdf-autotable` reads the `<table>` element from the DOM and converts it to a proper PDF table
- The function is client-side only (uses `document`) — this is correct, keep it in `export.ts`

- [ ] **Step 1: Install jsPDF and jsPDF-AutoTable**

```bash
cd e:/K4NN4N/Sahakar-Daily-Accounts && npm install jspdf jspdf-autotable
```

Expected: Both packages appear in `node_modules`. No peer dependency errors.

- [ ] **Step 2: Replace `exportToPDF` in `src/lib/export.ts`**

```typescript
/**
 * Utility functions for exporting data to various formats.
 */

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      const escaped = ("" + value).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportToPDF(elementId: string, filename: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const table = document.getElementById(elementId)?.querySelector("table");
  if (!table) {
    console.error(`[exportToPDF] No <table> found inside #${elementId}`);
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(14);
  doc.text(filename, 14, 15);

  autoTable(doc, {
    html: table,
    startY: 22,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd e:/K4NN4N/Sahakar-Daily-Accounts && npx tsc --noEmit
```

Expected: No errors. If jsPDF types are missing, run `npm install --save-dev @types/jspdf` (though jsPDF bundles its own types — this should not be needed).

- [ ] **Step 4: Manual test PDF export**

Navigate to `/reports`, populate some data, click PDF export. Expected: a `.pdf` file downloads with a formatted table (not a browser print dialog).

- [ ] **Step 5: Commit**

```bash
git add src/lib/export.ts package.json package-lock.json
git commit -m "feat: replace browser-print PDF export with jsPDF + autoTable"
```

---

## Self-Review Checklist

- [x] **Middleware** — covers unauthenticated → `/login` redirect and authenticated → `/dashboard` redirect from public pages. Static file exclusions prevent redirect loops on assets.
- [x] **Supabase types** — generated from live project, not hand-written. CLI command included.
- [x] **Entry page hardcoded permission** — `canSeeAllOutlets = true` removed; replaced with `canAccessAllOutlets(dbUser.role)` derived from real DB user.
- [x] **Audit logging** — `logAudit` never throws (try/catch inside), called after every mutation: daily account upsert, user create/update/delete, registration approve/reject.
- [x] **PDF export** — `jspdf` + `jspdf-autotable`, dynamic import (no SSR issues), landscape A4, downloads as a `.pdf` file.
- [x] No placeholders. All code blocks are complete.
- [x] Type consistency: `AuditParams` defined in `audit.ts`, imported in `accounts.ts` and `users.ts` via the same `logAudit` function.
