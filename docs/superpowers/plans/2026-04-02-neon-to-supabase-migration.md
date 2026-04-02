# Neon → Supabase Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the database layer from Neon Serverless PostgreSQL to Supabase PostgreSQL, keeping Drizzle ORM and Kinde Auth untouched.

**Architecture:** Swap the Neon HTTP driver (`@neondatabase/serverless` + `drizzle-orm/neon-http`) for `postgres` (postgres.js) with `drizzle-orm/postgres-js`. Supabase requires two connection URLs: a Transaction Pooler URL (port 6543) for serverless runtime, and a Direct URL for Drizzle-kit migrations. Schema, server actions, and all other code remain unchanged.

**Tech Stack:** Supabase PostgreSQL, postgres.js, Drizzle ORM 0.45.x, Next.js 16 App Router, Vercel Serverless

**Supabase Project:** `grdeedwkzqyfxgfeskdr` (https://grdeedwkzqyfxgfeskdr.supabase.co)

---

## Pre-flight: Get Connection Strings from Supabase Dashboard

Before any code changes, collect these two URLs from the Supabase Dashboard:

1. Go to https://supabase.com/dashboard/project/grdeedwkzqyfxgfeskdr/settings/database
2. Under **Connection string** → select **Transaction** pooler mode (port 6543):
   ```
   DATABASE_URL=postgresql://postgres.grdeedwkzqyfxgfeskdr:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
   Append `?pgbouncer=true` if not already present.
3. Under **Connection string** → select **Direct** connection (port 5432, host `db.grdeedwkzqyfxgfeskdr.supabase.co`):
   ```
   DIRECT_URL=postgresql://postgres:[PASSWORD]@db.grdeedwkzqyfxgfeskdr.supabase.co:5432/postgres
   ```

> **NOTE:** `@supabase/supabase-js` is NOT needed — we use Drizzle ORM directly. Do not install it.

---

## File Map

| Action | File | Change |
|--------|------|--------|
| Modify | `package.json` | Remove `@neondatabase/serverless`, add `postgres` |
| Modify | `src/db/index.ts` | Swap neon client → postgres.js client |
| Modify | `src/db/seed.ts` | Swap neon client → postgres.js client |
| Modify | `drizzle.config.ts` | Use `DIRECT_URL` for migrations |
| Modify | `.env.example` | Update to Supabase URL format |
| Modify | `.env.local` | Add real Supabase connection strings |

**No changes needed:** `src/db/schema.ts`, `src/lib/actions/*`, all API routes, all components.

---

## Task 1: Install postgres.js, Remove Neon Package

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install postgres.js**

```bash
npm install postgres
```

Expected output: `added 1 package` (or similar).

- [ ] **Step 2: Remove the Neon serverless package**

```bash
npm uninstall @neondatabase/serverless
```

Expected output: `removed 1 package`.

- [ ] **Step 3: Verify package.json**

Confirm `@neondatabase/serverless` is gone and `"postgres": "^3.x.x"` is present in `dependencies`.

---

## Task 2: Update `src/db/index.ts`

**Files:**
- Modify: `src/db/index.ts`

- [ ] **Step 1: Replace neon driver with postgres.js**

Replace the entire file content with:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use Transaction Pooler URL (DATABASE_URL) for serverless runtime.
// `prepare: false` is required when using PgBouncer in transaction mode.
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

## Task 3: Update `src/db/seed.ts`

**Files:**
- Modify: `src/db/seed.ts`

The seed script uses the neon client for raw SQL. Replace it with postgres.js.

- [ ] **Step 1: Replace neon import with postgres.js at the top of the file**

Replace lines 1 and 13:

```typescript
// OLD (remove these two lines):
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

// NEW (replace with):
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
```

The `sql` template tag usage (`sql\`...\``) is identical in postgres.js — no other changes needed in the file body.

- [ ] **Step 2: Verify seed compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

## Task 4: Update `drizzle.config.ts`

**Files:**
- Modify: `drizzle.config.ts`

Drizzle-kit migrations must use the **Direct** connection URL (bypasses PgBouncer, required for schema operations).

- [ ] **Step 1: Add DIRECT_URL support**

Replace entire file:

```typescript
import { config } from "dotenv";
config({ path: ".env.local" });
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL!, // Direct connection required for migrations
  },
  verbose: true,
  strict: true,
});
```

---

## Task 5: Update `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Replace Neon DATABASE_URL with Supabase format**

Replace entire file content:

```env
# Supabase Database — Transaction Pooler (port 6543) for runtime/serverless
DATABASE_URL=postgresql://postgres.grdeedwkzqyfxgfeskdr:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase Database — Direct connection (port 5432) for drizzle-kit migrations only
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.grdeedwkzqyfxgfeskdr.supabase.co:5432/postgres

# Kinde Authentication
KINDE_CLIENT_ID=f45549431a8f46deadfb224f824b8039
KINDE_CLIENT_SECRET=your_kinde_client_secret
KINDE_ISSUER_URL=https://doams.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=/dashboard
KINDE_POST_LOGOUT_REDIRECT_URL=/

# Deployment URL (Vercel)
VERCEL_URL=https://doams.vercel.app
```

---

## Task 6: Update `.env.local` with Real Supabase Credentials

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add the two Supabase connection strings**

Open `.env.local` and replace/add the database section with real values from the Supabase Dashboard (collected in Pre-flight):

```env
# Supabase Database — Transaction Pooler (serverless runtime)
DATABASE_URL=postgresql://postgres.grdeedwkzqyfxgfeskdr:[REAL-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase Database — Direct connection (for drizzle-kit migrations)
DIRECT_URL=postgresql://postgres:[REAL-PASSWORD]@db.grdeedwkzqyfxgfeskdr.supabase.co:5432/postgres

# Keep all existing Kinde variables unchanged below...
```

> **Never commit `.env.local` to git — it is already in `.gitignore`.**

---

## Task 7: Push Schema to Supabase

- [ ] **Step 1: Push the Drizzle schema to Supabase**

```bash
npm run db:push
```

This uses `DIRECT_URL` via `drizzle.config.ts` to create all 8 tables in Supabase.

Expected output:
```
[✓] Changes applied
```

- [ ] **Step 2: Verify tables exist in Supabase**

Go to https://supabase.com/dashboard/project/grdeedwkzqyfxgfeskdr/editor and confirm these tables are present:
- `outlets`
- `users`
- `daily_accounts`
- `account_categories`
- `account_groups`
- `chart_of_accounts`
- `audit_logs`
- `notifications`

---

## Task 8: Seed the Supabase Database

- [ ] **Step 1: Run the seed script**

```bash
npm run db:seed
```

Expected output:
```
🌱 Starting Sahakar ERP Seeding...
✅ Tables cleared.
📍 Provisioning 14 outlets...
  ✅ SHP-001 | MANJERI ...
  ...
✨ Seeding successful!
   - Total Outlets: 14
   - Total Entries: 420
   - Primary Admin: frpboy12@gmail.com
```

- [ ] **Step 2: Verify data in Supabase Table Editor**

Go to https://supabase.com/dashboard/project/grdeedwkzqyfxgfeskdr/editor → `outlets` table → confirm 14 rows.

---

## Task 9: Test the Application Locally

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test core flows**

1. Navigate to http://localhost:3000 → should redirect to `/admin/overview` (after login)
2. Login with Kinde (frpboy12@gmail.com)
3. Dashboard should show 14 outlets and recent entries
4. Submit a daily entry at `/entry` — should succeed without errors
5. Check `/reports` — should show data from Supabase

- [ ] **Step 3: Confirm no Neon imports remain**

```bash
grep -r "neondatabase" src/
```

Expected: No output (zero matches).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/db/index.ts src/db/seed.ts drizzle.config.ts .env.example
git commit -m "feat: migrate database layer from Neon to Supabase

- Swap @neondatabase/serverless for postgres.js driver
- Use drizzle-orm/postgres-js adapter
- Add DIRECT_URL for drizzle-kit migrations (bypasses PgBouncer)
- DATABASE_URL points to Supabase Transaction Pooler (port 6543)
- prepare: false required for PgBouncer transaction mode"
```

---

## Task 10: Update Vercel Environment Variables

- [ ] **Step 1: Add environment variables in Vercel Dashboard**

Go to https://vercel.com/dashboard → your project → Settings → Environment Variables.

Add/update these for **Production**, **Preview**, and **Development**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Transaction Pooler URL (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Direct connection URL (port 5432, `db.xxx.supabase.co`) |

Keep all existing Kinde variables unchanged.

- [ ] **Step 2: Trigger a production deploy**

```bash
git push origin main
```

- [ ] **Step 3: Verify production**

Visit https://doams.vercel.app → login → confirm dashboard loads with Supabase data.

---

## Done Checklist

- [ ] `@neondatabase/serverless` removed from `package.json`
- [ ] `postgres` package installed
- [ ] `src/db/index.ts` uses `drizzle-orm/postgres-js`
- [ ] `src/db/seed.ts` uses `postgres` client
- [ ] `drizzle.config.ts` uses `DIRECT_URL`
- [ ] `.env.local` has both `DATABASE_URL` (pooler) and `DIRECT_URL` (direct)
- [ ] `.env.example` updated
- [ ] Schema pushed to Supabase (8 tables)
- [ ] Seed data populated (14 outlets, 420 entries)
- [ ] Local dev tested — dashboard, entry form, reports all work
- [ ] No `neondatabase` imports remain in `src/`
- [ ] Vercel env vars updated
- [ ] Production deploy verified
