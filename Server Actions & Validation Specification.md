# Server Actions & Validation Specification — DOAMS

## Pattern

All mutations use Next.js Server Actions (`"use server"`). No separate API routes for form submissions. The standard flow:

1. Authenticate caller via Supabase
2. Check caller's role from DB
3. Validate input with Zod
4. Perform DB operation via Drizzle
5. Call `logAudit()`
6. Call `revalidatePath()` if needed
7. Return `{ success: true }` or `{ success: false, error: string }`

---

## Zod Validation Schema (`src/lib/validations/entry.ts`)

```typescript
import { z } from "zod";

export const dailyEntrySchema = z.object({
  date: z.string(),                                          // DATE string (YYYY-MM-DD)
  outletId: z.string().uuid(),
  saleCash: z.coerce.number().min(0).default(0),
  saleUpi: z.coerce.number().min(0).default(0),
  saleCredit: z.coerce.number().min(0).default(0),
  saleReturn: z.coerce.number().min(0).default(0),
  expenses: z.coerce.number().min(0).default(0),
  purchase: z.coerce.number().min(0).default(0),
  closingStock: z.coerce.number().min(0).default(0),
});

export type DailyEntryInput = z.infer<typeof dailyEntrySchema>;
```

---

## `submitDailyAccount` (`src/lib/actions/accounts.ts`)

```typescript
"use server";

export async function submitDailyAccount(rawData: unknown) {
  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // 2. Get DB user for role + outletId
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!dbUser) return { success: false, error: "User not found" };

  // 3. Validate
  const result = dailyEntrySchema.safeParse(rawData);
  if (!result.success) return { success: false, error: "Invalid data" };
  const data = result.data;

  // 4. Scope outlet — outlet users cannot submit for other outlets
  const isGlobal = canAccessAllOutlets(dbUser.role!);
  const targetOutletId = isGlobal ? data.outletId : dbUser.outletId!;

  // 5. Detect existing for audit log
  const existing = await db.select().from(dailyAccounts)
    .where(and(eq(dailyAccounts.outletId, targetOutletId), eq(dailyAccounts.date, data.date)))
    .limit(1);
  const isUpdate = existing.length > 0;

  // 6. Upsert
  await db.insert(dailyAccounts).values({ ...data, outletId: targetOutletId, createdBy: user.id })
    .onConflictDoUpdate({
      target: [dailyAccounts.outletId, dailyAccounts.date],
      set: { ...data, updatedAt: new Date() },
    });

  // 7. Audit
  await logAudit({
    userId: user.id,
    action: isUpdate ? "update" : "create",
    entityType: "daily_account",
    entityId: `${targetOutletId}:${data.date}`,
    oldData: isUpdate ? existing[0] as Record<string, unknown> : undefined,
    newData: data as unknown as Record<string, unknown>,
  });

  revalidatePath("/reports");
  revalidatePath("/entry");
  return { success: true, message: isUpdate ? "Entry updated" : "Entry saved" };
}
```

**Key decisions:**
- `onConflictDoUpdate` — one row per outlet per day; re-submission updates rather than errors
- Numeric fields stored as strings by Drizzle for `NUMERIC` precision — never float
- `outletId` from session for outlet users — form value ignored (prevents ID spoofing)
- Audit log captures old snapshot before overwrite
- `outlet_manager` is blocked from creating or overwriting entries older than 31 days

## Edit Deep Linking

- `/entry?date=YYYY-MM-DD&outletId=<uuid>` is used to open an existing daily account in edit mode.
- The entry page resolves the record server-side and passes `initialValues` into `DailyEntryForm`.
- `/reports/own` generates these deep links from each editable row.

---

## `createUser` / `updateUser` / `deleteUser` (`src/lib/actions/users.ts`)

All three require `admin` role:

```typescript
const [caller] = await db.select({ role: users.role })
  .from(users).where(eq(users.id, authUser.id)).limit(1);
if (!caller || caller.role !== "admin")
  return { success: false, error: "Only admins can perform this action" };
```

---

## `approveRegistrationRequest` (`src/lib/actions/registrations.ts`)

Admin only. Uses Supabase Admin API to create the auth user with the password the registrant set:

```typescript
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const { data: createdUser } = await adminSupabase.auth.admin.createUser({
  email: request.email,
  password: request.password ?? undefined,
  email_confirm: true,
  user_metadata: { name: request.name },
});

// Insert into users table with Supabase UUID
await db.insert(users).values({
  id: createdUser.user.id,  // must match Supabase Auth UUID
  name: request.name,
  email: request.email,
  role: role,
  outletId: outletId ?? null,
  isActive: "true",
});

// Clear stored password
await db.update(registrationRequests).set({ password: null })
  .where(eq(registrationRequests.id, requestId));
```

---

## `logAudit` (`src/lib/actions/audit.ts`)

```typescript
export async function logAudit({
  userId, userName, action, entityType, entityId, oldData, newData,
}: AuditParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId, userName, action, entityType, entityId, oldData, newData,
    });
  } catch (err) {
    console.error("[audit] Failed:", err);
    // Never throws — audit failure must not break the calling action
  }
}
```

---

## Frontend Usage

```typescript
// In a client component
const result = await submitDailyAccount(formValues);
if (result.success) {
  toast.success(result.message);
} else {
  toast.error(result.error);
}
```
