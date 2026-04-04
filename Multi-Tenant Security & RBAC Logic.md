# Multi-Tenant Security & RBAC Logic — DOAMS

## Overview

DOAMS serves 14 outlets. Each outlet has staff who should only see their own outlet's data. Head office roles see everything. All enforcement is server-side — the client UI hides elements, but security depends on server checks.

---

## Role Definitions

Roles are stored in the `users.role` column in PostgreSQL. Supabase Auth handles identity only — it knows nothing about roles.

| Role | DB value | Scope |
|---|---|---|
| Admin | `admin` | Full system access |
| HO Accountant | `ho_accountant` | All outlets, no user management |
| Outlet Manager | `outlet_manager` | Assigned outlet only |
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
const [caller] = await db.select({ role: users.role })
  .from(users).where(eq(users.id, authUser.id)).limit(1);

if (!caller || (caller.role !== "admin" && caller.role !== "ho_accountant")) {
  redirect("/dashboard");
}
const isAdmin = caller.role === "admin";
```

Pages with role guards:
- `/admin/users` — outlet roles redirected; ho_accountant gets read-only view
- `/admin/overview` — outlet roles redirected
- `/entry` — outlet selection derived from session, not URL params

### Layer 3 — Server Action Role Check

Every mutating server action validates the caller's role from the DB before executing:

```typescript
// Only admin can create/update/delete users
const [caller] = await db.select({ role: users.role })
  .from(users).where(eq(users.id, authUser.id)).limit(1);
if (!caller || caller.role !== "admin")
  return { success: false, error: "Only admins can perform this action" };
```

Actions and their required roles:

| Action | Required Role |
|---|---|
| `createUser` | `admin` |
| `updateUser` | `admin` |
| `deleteUser` | `admin` |
| `approveRegistrationRequest` | `admin` |
| `rejectRegistrationRequest` | `admin` |
| `submitDailyAccount` | any authenticated user (outlet scoped) |

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
- **`/admin/users`:** Add User form and Pending Registrations hidden for ho_accountant; edit/delete buttons hidden via `isAdmin` prop
- **Entry form:** Outlet selector shows all outlets for admin/ho_accountant; outlet-level users see only their outlet

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
    "view:dashboard", "view:own_outlet", "view:own_reports", "view:accounts",
    "entry:create", "entry:edit_own", "reports:export",
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
  action: "create",         // what (create | update | delete | approve | reject)
  entityType: "user",       // entity type
  entityId: newUserId,      // which record
  oldData: previousRecord,  // JSONB snapshot before change
  newData: newRecord,       // JSONB snapshot after change
});
```

`logAudit()` is in `src/lib/actions/audit.ts`. It never throws — audit failure is logged to console and never blocks the main operation.
