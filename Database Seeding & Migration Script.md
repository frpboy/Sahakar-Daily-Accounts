# Database Seeding & Migration — DOAMS

## Connection Setup

Two connection strings are required in `.env.local`:

```env
# Port 6543 — Transaction Pooler (PgBouncer) — used by the app at runtime
DATABASE_URL=postgresql://postgres.grdeedwkzqyfxgfeskdr:PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres

# Port 5432 — Direct connection — used by drizzle-kit push/generate ONLY
DIRECT_URL=postgresql://postgres:PASSWORD@db.grdeedwkzqyfxgfeskdr.supabase.co:5432/postgres
```

`drizzle.config.ts` uses `DIRECT_URL` so schema operations bypass PgBouncer (which cannot handle DDL).

---

## Scripts

```bash
npm run db:push       # Push Drizzle schema to Supabase (uses DIRECT_URL)
npm run db:generate   # Generate SQL migration files into /drizzle folder
npm run db:studio     # Open Drizzle Studio at http://localhost:5173
npm run db:seed       # Seed 14 outlets + 420 dummy daily entries + admin user
```

---

## Initial Setup

```bash
# 1. Push schema (creates all 12 tables in Supabase)
npm run db:push

# 2. Seed data
npm run db:seed
```

Seed creates:
- 14 outlets across 7 locations (2 types each: pharmacy + clinic)
- 420 daily account entries (14 outlets × 30 days of dummy data)
- Admin user row in `users` table (update `id` to match Supabase Auth UUID after creating auth user)

---

## Schema Change Workflow

### Development
```bash
# 1. Edit src/db/schema.ts
# 2. Push directly to Supabase
npm run db:push
```

### Production
```bash
# 1. Edit src/db/schema.ts
# 2. Generate SQL migration file — review before applying
npm run db:generate
# 3. Apply in Supabase SQL Editor (Dashboard → SQL Editor)
```

Do not run `db:push` against production blindly — it applies changes immediately. Use `db:generate` to review the SQL first.

---

## Manual SQL Patches

For small column additions, run directly in Supabase SQL Editor:

```sql
-- Example: add column added in session 4
ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS password TEXT;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'registration_requests';
```

---

## Data Integrity Rules

- **Never drop columns immediately.** If removing a field, deprecate it in code first, then drop in a later migration after verifying no reads/writes reference it.
- **Always provide defaults for new numeric columns** — `.default("0")` — so existing historical rows don't have NULLs in financial fields.
- **NUMERIC(12,2) for all money.** Never float. Drizzle returns numeric columns as strings — use `Number(value)` or `parseFloat()` for arithmetic, then `toFixed(2)` for display.

---

## Current Schema (12 tables)

| Table | Key columns |
|---|---|
| `outlets` | `id` (uuid), `name`, `location`, `code`, `type`, `is_active` |
| `users` | `id` (text = Supabase Auth UUID), `name`, `email`, `role`, `outlet_id`, `is_active` |
| `daily_accounts` | `outlet_id`, `date` (UNIQUE together), all monetary NUMERIC(12,2) fields |
| `account_categories` | `id`, `name` |
| `account_groups` | `id`, `name`, `category_id`, `parent_group_id` (self-referential) |
| `chart_of_accounts` | `id`, `code`, `name`, `group_id`, `is_active` |
| `audit_logs` | `user_id`, `action`, `entity_type`, `entity_id`, `old_data` (jsonb), `new_data` (jsonb) |
| `notifications` | `user_id`, `type`, `title`, `message`, `is_read` |
| `registration_requests` | `name`, `email`, `phone`, `password` (cleared after approval), `status` |
| `financial_years` | `name`, `start_date`, `end_date`, `is_current` |
| `system_preferences` | `outlet_id` (nullable), `key`, `value` |
| `submission_reminders` | `outlet_id`, `time`, `days`, `is_active` |
