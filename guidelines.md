# Development Guidelines — DOAMS

## 1. Financial Data Integrity

- **Never use float for money.** All monetary columns are `NUMERIC(12, 2)` in PostgreSQL. JavaScript `number` causes rounding errors (`0.1 + 0.2 = 0.30000000000000004`).
- **Unique constraint on entries.** `daily_accounts(outlet_id, date)` UNIQUE — enforced at DB level. The app also detects this at form level and prompts overwrite confirmation.
- **Recalculate on server.** Never trust totals from the client. Receive individual fields (cash, UPI, credit) and validate/calculate server-side.
- **IST timezone.** All date handling uses IST (UTC+5:30). The entry form enforces this to prevent off-by-one date errors.

## 2. Security & RBAC

- **Every mutating server action must check the caller's role from the DB**, not from client-supplied data. Pattern:
  ```typescript
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const [caller] = await db.select({ role: users.role })
    .from(users).where(eq(users.id, user.id)).limit(1);
  if (!caller || caller.role !== "admin") return { error: "Forbidden" };
  ```
- **SUPABASE_SERVICE_ROLE_KEY** is used only in server actions for `admin.createUser()`. Never import it in client components or API routes that could be called from the browser.
- **Outlet scoping.** Outlet-level users (outlet_manager, outlet_accountant) must never receive data for other outlets. Server actions derive `outletId` from the session, never from request params.
- **ID swapping prevention.** The entry server action reads the user's `outletId` from the DB — it ignores any `outletId` sent from the form for outlet-level users.

## 3. Authentication

- Supabase Auth handles identity. Roles and outlet assignments are in the `users` DB table.
- Route protection is in `src/proxy.ts`. Public paths: `/login`, `/register`, `/api/auth/callback`, `/update-password`. Everything else requires a session.
- **Do NOT add `export const runtime` to `proxy.ts`** — Next.js 16 proxy files always run on Node.js and reject this export at build time.
- Auth-redirect paths (authenticated users bounced to `/dashboard`): only `/login` and `/register`. `/update-password` must remain accessible while authenticated (password reset flow).

## 4. Database Queries

- All queries use **Drizzle ORM** — never raw SQL strings in application code.
- Use `db.select().from(table).where(...)` for reads, `db.insert().values(...)` for inserts, `db.update().set(...).where(...)` for updates.
- The `prepare: false` option on the postgres.js client is mandatory for Supabase's PgBouncer transaction mode. Do not remove it.
- Use `DIRECT_URL` (port 5432) for `drizzle-kit push/generate` — this bypasses PgBouncer which cannot handle DDL.
- Use `DATABASE_URL` (port 6543) for everything else.

## 5. Server Actions

- All mutations go through Server Actions (`"use server"` files in `src/lib/actions/`).
- Every action that changes data must call `logAudit()` at the end. `logAudit()` never throws — audit failure is silent and must not block the main operation.
- Return `{ success: true }` or `{ success: false, error: string }` — never throw from server actions.
- Call `revalidatePath()` after mutations that affect cached pages.

## 6. Components

- Pages that need auth data should be **Server Components** that fetch from the DB directly. Avoid client-side data fetching for initial page load.
- Client components that need the Supabase client use `createClient()` from `src/lib/supabase/client.ts`.
- Server components and actions use `createClient()` from `src/lib/supabase/server.ts` (async).
- Add `error.tsx` alongside `page.tsx` for any page that does DB queries.

## 7. UI Conventions

- Toasts via **Sonner** (`toast.success()`, `toast.error()`) — not browser `alert()`.
- All monetary values formatted as INR (`₹`) with `Intl.NumberFormat` or explicit `toFixed(2)`.
- Loading states: use animated skeletons (`animate-pulse`) for tables, spinners for small actions.
- Confirmation for destructive actions: overwrite existing entries shows an amber banner requiring explicit "Yes, overwrite" click before submit is enabled.

## 8. Code Style

- No `any` types where avoidable — use `unknown` and narrow, or use Drizzle/Supabase inferred types.
- Server actions validate inputs with **Zod** before touching the database.
- Dynamic imports (`await import(...)`) for heavy client-side libraries (jsPDF) to avoid SSR failures.
- Keep components focused — forms, tables, pages are separate files. No 500-line single-file components.
