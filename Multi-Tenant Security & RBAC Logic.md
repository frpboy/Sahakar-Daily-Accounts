This is the most critical part of your application. In a multi-outlet system, "Multi-Tenancy" ensures that a manager from **Tirur** cannot see or modify the accounts for **Manjeri**.

Using **Clerk + Drizzle**, here is the technical implementation of your security layer.

---

### 1. Clerk User Metadata Strategy
We will use Clerk’s `publicMetadata` to store the user's role and their assigned outlet ID. This metadata is accessible on the server without extra database hits.

**User Metadata Structure:**
*   **Admin:** `{ "role": "admin" }`
*   **Manager:** `{ "role": "manager", "outletId": "uuid-of-melattur" }`

---

### 2. Defining the RBAC Helper (Server-Side)
Create a utility to extract these permissions safely in your Next.js Server Components and Actions.

```typescript
// src/lib/auth-utils.ts
import { auth } from "@clerk/nextjs/server";

export async function getSessionContext() {
  const { sessionClaims, userId } = auth();

  if (!userId) throw new Error("Unauthorized");

  // These are custom types you define in your clerk.d.ts
  const role = sessionClaims?.metadata?.role as "admin" | "manager";
  const outletId = sessionClaims?.metadata?.outletId as string | undefined;

  return {
    userId,
    role,
    outletId,
    isAdmin: role === "admin",
    isManager: role === "manager",
  };
}
```

---

### 3. Data Isolation (The "Read" Layer)
When fetching data for the dashboard, the query must be dynamically filtered based on the logged-in user’s role.

```typescript
// src/lib/actions/fetch-data.ts
import { db } from "@/db";
import { dailyAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionContext } from "@/lib/auth-utils";

export async function getDailyEntries(filterDate?: string) {
  const { isAdmin, outletId } = await getSessionContext();

  if (isAdmin) {
    // Admin sees everything
    return await db.select().from(dailyAccounts);
  }

  if (!outletId) throw new Error("Manager has no assigned outlet");

  // Manager is strictly filtered by their outletId
  return await db
    .select()
    .from(dailyAccounts)
    .where(eq(dailyAccounts.outletId, outletId));
}
```

---

### 4. Mutation Protection (The "Write" Layer)
A common security flaw is "ID Swapping," where a user sends a different `outletId` in the form body. You must ignore the ID sent by the client and use the ID from the **Session Metadata**.

```typescript
// src/lib/actions/submit-entry.ts
"use server"
import { db } from "@/db";
import { dailyAccounts } from "@/db/schema";
import { getSessionContext } from "@/lib/auth-utils";

export async function createEntry(formData: any) {
  const { isAdmin, outletId, userId } = await getSessionContext();

  // 1. Determine which outlet this entry belongs to
  // If admin, they might pick from a dropdown. If manager, it's forced.
  const targetOutletId = isAdmin ? formData.outletId : outletId;

  if (!targetOutletId) throw new Error("Target outlet required");

  // 2. Perform the Insert
  await db.insert(dailyAccounts).values({
    ...formData,
    outletId: targetOutletId, // Enforced server-side
    createdBy: userId,
  });
}
```

---

### 5. Middleware Route Protection
To prevent Managers from even accessing the `/admin` URL, use Clerk Middleware.

```typescript
// src/middleware.ts
import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  afterAuth(auth, req) {
    const role = auth.sessionClaims?.metadata?.role;
    const isReportsPage = req.nextUrl.pathname.startsWith("/reports");

    // If a manager tries to access the global reports page, redirect them
    if (isReportsPage && role !== "admin") {
      return NextResponse.redirect(new URL("/entry", req.url));
    }
  },
});
```

---

### 6. Implementation Guidelines for You:
1.  **Strict Typing:** Create a `types/clerk.d.ts` file to ensure `sessionClaims.metadata` is typed. This prevents bugs where you misspell `outletID` vs `outletId`.
2.  **Audit Trail:** Always include the `createdBy` field (the Clerk User ID) in the `daily_accounts` table. If a manager makes a mistake, the Admin needs to know which user was logged in.
3.  **Neon Row Level Security (Optional):** If you want "Bank-grade" security, you can enable **RLS (Row Level Security)** in Neon/Postgres. However, for an internal business app, the **Server Action enforcement** (Step 4) is usually sufficient and easier to maintain.

### Summary of Security Rules:
*   **Admins:** Query = `SELECT *`
*   **Managers:** Query = `SELECT * WHERE outlet_id = CURRENT_USER_METADATA_OUTLET_ID`
*   **Validation:** Manager input is **always** overwritten with their session's `outletId` before saving.

**Next, should I provide the Database Seeding script to create your 5 outlets and admin user?**