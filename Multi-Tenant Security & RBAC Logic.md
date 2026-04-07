# Multi-Tenant Security & RBAC Logic — DOAMS

## Overview

DOAMS serves 14 outlets. Each outlet has staff who should only see their own outlet's data. Head office roles see everything. All enforcement is server-side — the client UI hides elements, but security depends on server checks.

---

## Role Definitions

Roles are stored in the `users.role` column in PostgreSQL. Supabase Auth handles identity only — it knows nothing about roles.

| Role | DB value | Scope |
|---|---|---|
| Admin | `admin` | Full system access |
| HO Accountant | `ho_accountant` | All outlets, read-only user visibility |
| Outlet Manager | `outlet_manager` | Assigned outlet only, can manage outlet accountant users in that outlet |
| Outlet Accountant | `outlet_accountant` | Assigned outlet only |

---

## Enforcement Layers

### Layer 1 — Routing Middleware (`src/proxy.ts`)

Runs before every request. Checks Supabase session cookie.

```typescript
const PUBLIC_PATHS = ["/login", "/register", "/api/auth/callback", "/update-password"];
const AUTH_REDIRECT_PATHS = ["/login", "/register"]; // bounce authenticated users away

// Unauthenticated → protected route: redirect /login
// Authenticated → AUTH_REDIRECT_PATHS: redirect /dashboard
```

This prevents unauthenticated access to any page. It does NOT check roles — that's done at page level.

### Layer 2 — Page-Level Role Check (Server Components)

Pages that require specific roles redirect at render time:

```typescript
// src/app/admin/users/page.tsx
const [caller] = await db.select({ role: users.role, outletId: users.outletId })
  .from(users).where(eq(users.id, authUser.id)).limit(1);

if (!caller || (caller.role !== "admin" && caller.role !== "ho_accountant" && caller.role !== "outlet_manager")) {
  redirect("/dashboard");
}
```

Pages with role guards:
- `/admin/users` — admin gets full user management, ho_accountant gets read-only view, outlet_manager gets outlet-scoped accountant management
- `/admin/overview` — outlet roles redirected
- `/entry` — outlet selection derived from session, not URL params

### Layer 3 — Server Action Role Check

Every mutating server action validates the caller's role from the DB before executing:

```typescript
const caller = await getCaller();
if (!caller) return { success: false, error: "Unauthorized" };
```

Actions and their required roles:

| Action | Required Role |
|---|---|
| `createUser` | `admin`, or `outlet_manager` for `outlet_accountant` in own outlet |
| `updateUser` | `admin`, or `outlet_manager` for `outlet_accountant` in own outlet |
| `deleteUser` | `admin`, or `outlet_manager` for `outlet_accountant` in own outlet |
| `approveRegistrationRequest` | `admin` |
| `rejectRegistrationRequest` | `admin` |
| `submitDailyAccount` | any authenticated user (outlet scoped, outlet_manager limited to last 31 days) |

### Layer 4 — Outlet Scoping in Queries

For outlet-level users, the outlet ID is always derived from the session — never from request parameters:

```typescript
// src/lib/actions/accounts.ts
const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);

const isGlobal = canAccessAllOutlets(dbUser.role!); // admin or ho_accountant
const targetOutletId = isGlobal ? formData.outletId : dbUser.outletId;
// If outlet user sends a different outletId in the form — it is ignored
```

### Layer 5 — UI Conditional Rendering

The UI hides elements based on role, but this is cosmetic only — security depends on the layers above.

- **TopNav:** Staff link hidden for outlet-level roles
- **`/admin/users`:** Admin gets full controls; ho_accountant sees a read-only user list; outlet_manager can add/edit/delete `outlet_accountant` users for their own outlet only
- **Entry form:** Outlet selector shows all outlets for admin/ho_accountant; outlet-level users see only their outlet
- **Own reports:** Edit deep links point to `/entry?date=...&outletId=...`; entries older than 31 days show a lock icon for `outlet_manager`
- **Reports:** Both report pages are paginated; export actions fetch the full filtered dataset instead of only the visible page

---

## Permission Matrix (`src/lib/permissions.ts`)

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view:dashboard", "view:all_outlets", "view:own_outlet",
    "view:reports", "view:own_reports", "view:accounts", "view:users",
    "entry:create", "entry:edit_own", "entry:edit_all",
    "reports:export", "users:create", "users:edit", "users:delete", "accounts:manage",
  ],
  ho_accountant: [
    "view:dashboard", "view:all_outlets", "view:own_outlet",
    "view:reports", "view:own_reports", "view:accounts", "view:users",
    "entry:create", "entry:edit_all", "reports:export",
    // NOT included: users:create, users:edit, users:delete, accounts:manage
  ],
  outlet_manager: [
    "view:dashboard", "view:own_outlet", "view:own_reports", "view:accounts", "view:users",
    "entry:create", "entry:edit_own", "reports:export",
    "users:create", "users:edit", "users:delete",
  ],
  outlet_accountant: [
    "view:dashboard", "view:own_outlet", "view:own_reports", "view:accounts",
    "entry:create", "entry:edit_own", "reports:export",
  ],
};
```

Helper functions:
```typescript
hasPermission(role, permission)                          // check single permission
canAccessAllOutlets(role)                               // true for admin + ho_accountant
canAccessOutlet(role, userOutletId, targetOutletId)     // scoped outlet check
```

---

## Audit Trail

Every create, update, delete, approve, and reject action writes to `audit_logs`:

```typescript
await logAudit({
  userId: authUser.id,      // who
  userName: dbUser.name,    // display name for audit viewers
  action: "create",         // what (create | update | delete | approve | reject)
  entityType: "user",       // entity type (also supports "outlet")
  entityId: newUserId,      // which record
  oldData: previousRecord,  // JSONB snapshot before change
  newData: newRecord,       // JSONB snapshot after change
});
```

`logAudit()` is in `src/lib/actions/audit.ts`. It never throws — audit failure is logged to console and never blocks the main operation.

---

## Notes

- App users and Supabase Auth users are now treated as a single identity model: a staff account is provisioned in Supabase Auth first, then persisted in the `users` table with the same ID.
- Registration requests still temporarily store a password because this is an internal tool, but the value is cleared after approval.
- Daily entry date handling uses timezone-safe helpers to preserve IST business dates through edit and submit flows.
