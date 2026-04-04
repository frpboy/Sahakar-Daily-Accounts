# Deployment & Environment Checklist — DOAMS

## Environment Variables

### Local Development (`.env.local`)

```env
# Transaction Pooler — port 6543 — used by the app at runtime
DATABASE_URL=postgresql://postgres.grdeedwkzqyfxgfeskdr:PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres

# Direct connection — port 5432 — used by drizzle-kit push/generate ONLY
DIRECT_URL=postgresql://postgres:PASSWORD@db.grdeedwkzqyfxgfeskdr.supabase.co:5432/postgres

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://grdeedwkzqyfxgfeskdr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...    # safe for client (public)
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # server only — NEVER expose
```

### Vercel Project Settings

Set all 5 variables above in Vercel → Project → Settings → Environment Variables for `Production`, `Preview`, and `Development` environments.

| Variable | Scope |
|---|---|
| `DATABASE_URL` | All |
| `DIRECT_URL` | All (used locally for db:push only) |
| `NEXT_PUBLIC_SUPABASE_URL` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | All — **keep secret** |

---

## Supabase Setup

### Auth Settings
- **Site URL:** `https://doams.vercel.app`
- **Redirect URLs (allowed):**
  - `https://doams.vercel.app/api/auth/callback`
  - `http://localhost:3000/api/auth/callback`
- **SMTP provider:** Brevo (configured)
  - Host: `smtp-relay.brevo.com`, port 587
  - Username: `a70a1b001@smtp-brevo.com`
  - Sender name: `Sahakar Accounts`
  - Sender email: `frpboy12@gmail.com`

### Database
- Project ref: `grdeedwkzqyfxgfeskdr`
- Region: ap-southeast-2 (Sydney)
- Schema pushed via `npm run db:push` (uses DIRECT_URL)
- Connection pooler mode: Transaction (port 6543)

---

## Initial Admin Setup

1. Go to Supabase Dashboard → Authentication → Users → "Add user"
2. Email: admin email, set password, tick "Auto Confirm User"
3. Copy the generated UUID
4. In Supabase SQL Editor:
   ```sql
   -- If user row doesn't exist yet
   INSERT INTO users (id, name, email, role, is_active)
   VALUES ('<UUID>', 'Admin Name', 'admin@email.com', 'admin', 'true');

   -- Or if seeded with wrong id
   UPDATE users SET id = '<UUID>' WHERE email = 'admin@email.com';
   ```

---

## Deployment Process

### Auto-deploy (normal)
```bash
git push origin main
# Vercel picks it up automatically
```

### Manual deploy
```bash
vercel deploy --prod
```

### Vercel Build Settings
- **Framework preset:** Next.js
- **Root directory:** `./`
- **Build command:** `next build`
- **Install command:** `npm install`
- **Output directory:** `.next` (auto-detected)

---

## Schema Changes

```bash
# 1. Edit src/db/schema.ts
# 2. Push to Supabase (uses DIRECT_URL, bypasses PgBouncer)
npm run db:push

# For production migrations — generate SQL first, review, then apply in Supabase SQL Editor
npm run db:generate
```

**Do not run `db:push` against production without reviewing the changes.** For production schema changes, generate SQL via `db:generate`, review the migration file, and apply it in the Supabase SQL Editor.

---

## Post-Deployment Verification

1. **Auth check** — visit `/entry` without logging in → should redirect to `/login`
2. **Role check (outlet user)** — log in as outlet_manager → should NOT see Staff link, should NOT be able to access `/admin/users`
3. **Role check (ho_accountant)** — log in as ho_accountant → Staff link visible, users list read-only (no edit/delete buttons)
4. **Role check (admin)** — full access including Add User form and Pending Registrations
5. **Entry submission** — submit a daily entry → check Supabase table `daily_accounts` for new row
6. **Duplicate guard** — submit same date + outlet again → amber overwrite warning shown
7. **Forgot password** → email arrives → link opens `/update-password` → password changes successfully
8. **PDF export** — click export on reports page → PDF downloads
9. **PWA install** — open in Chrome → install banner appears
10. **Mobile numeric pad** — open entry form on phone → number pad appears for financial inputs

---

## Known Production Notes

- Brevo sender `frpboy12@gmail.com` may hit Gmail DMARC — consider adding a custom domain in Brevo for reliable delivery
- Push notification server-side (VAPID) not yet implemented — local notifications only
- `proxy.ts` does NOT support `export const runtime` — Next.js 16 proxy always runs on Node.js
