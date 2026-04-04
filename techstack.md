# DOAMS Tech Stack

## Core Framework

**Next.js 16.2.2 (App Router + Turbopack)**
- Server Components for data-fetching pages (no client-side fetch waterfalls)
- Server Actions (`"use server"`) for all mutations — no separate API endpoints needed for forms
- Route protection via `src/proxy.ts` (Next.js 16 routing middleware, always Node.js runtime)
- Error boundaries via `error.tsx` files

**TypeScript** — strict typing throughout; Drizzle and Supabase both provide full inferred types.

---

## Database & ORM

**Supabase PostgreSQL** (project: `grdeedwkzqyfxgfeskdr`, region: ap-southeast-2)

Two connection strings are required:
- `DATABASE_URL` — Transaction Pooler on port **6543** (PgBouncer). Used by the app at runtime on Vercel.
- `DIRECT_URL` — Direct connection on port **5432**. Used only by `drizzle-kit push/generate` (bypasses PgBouncer, required for DDL).

**Drizzle ORM** with `postgres.js` driver
- `prepare: false` is mandatory — PgBouncer transaction mode doesn't support prepared statements
- Schema: `src/db/schema.ts` (12 tables)
- Config: `drizzle.config.ts` uses `DIRECT_URL`

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
```

---

## Authentication

**Supabase Auth**

| Method | How |
|---|---|
| Email + Password | `supabase.auth.signInWithPassword()` |
| Magic Link | `supabase.auth.signInWithOtp()` |
| Forgot Password | `supabase.auth.resetPasswordForEmail()` → `/update-password` |
| Admin create user | `supabase.auth.admin.createUser()` via service role key |

Three Supabase client utilities:
- `src/lib/supabase/client.ts` — `createBrowserClient()` for client components
- `src/lib/supabase/server.ts` — `createServerClient()` (async) for server components/actions

RBAC roles are stored in the `users` DB table, not in Supabase Auth metadata. Every server action reads the caller's role from the DB.

---

## Email

**Brevo SMTP** (configured in Supabase Dashboard → Auth → SMTP settings)
- Host: `smtp-relay.brevo.com`, port 587, TLS
- SMTP username: `a70a1b001@smtp-brevo.com`
- Sender: `frpboy12@gmail.com` (verified in Brevo)
- Free tier: 300 emails/day
- Handles: password reset emails, magic link emails

---

## UI & Styling

**Tailwind CSS** — utility-first styling, custom `shadow-premium-lg` and animation utilities.

**shadcn/ui** — component library. Components in use:
`button`, `input`, `select`, `card`, `form`, `label`, `table`, `container`, `badge`, `switch`, `avatar`, `dropdown-menu`, `dialog`

**Geist font** (via `geist` npm package) — sans for body, mono for numeric/code values.

**Lucide React** — icon set throughout.

**Sonner** — toast notifications (`<Toaster position="top-center" richColors closeButton />`).

---

## Validation

**Zod** — schema validation for all server actions. Entry form schema in `src/lib/validations/entry.ts`.

---

## PDF Export

**jsPDF + jspdf-autotable**
- Dynamic import (`await import(...)`) to avoid SSR issues
- A4 landscape, reads table DOM by element ID
- Downloads directly without print dialog

```typescript
// src/lib/export.ts
const { default: jsPDF } = await import("jspdf");
const { default: autoTable } = await import("jspdf-autotable");
```

---

## PWA

- `public/manifest.json` — name, icons (192×192, 512×512), `display: standalone`, `start_url: /dashboard`
- `public/sw.js` — service worker; handles `push` events and `notificationclick`
- `src/components/shared/PWAPrompt.tsx` — `beforeinstallprompt` install banner + notification permission banner
- Manifest linked via `metadata.manifest` in `src/app/layout.tsx`

---

## Audit Logging

Every mutating server action calls `logAudit()` from `src/lib/actions/audit.ts`:
- Records: `userId`, `userName`, `action`, `entityType`, `entityId`, `oldData` (JSONB), `newData` (JSONB)
- Never throws — audit failure is silent so it never blocks the main operation

---

## Deployment

**Vercel** — auto-deploys from `main` branch on GitHub.
- Build: `next build` (Turbopack)
- Node.js 18+ runtime
- All 5 environment variables set in Vercel project settings

---

## Summary Table

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.2.2 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS + shadcn/ui | latest |
| Font | Geist (sans + mono) | latest |
| Icons | Lucide React | latest |
| Toasts | Sonner | latest |
| Database | Supabase PostgreSQL | hosted |
| DB Driver | postgres.js | 3.4.8 |
| ORM | Drizzle ORM | latest |
| Auth | Supabase Auth | latest |
| Email | Brevo SMTP | — |
| Validation | Zod | latest |
| PDF | jsPDF + jspdf-autotable | latest |
| Hosting | Vercel | — |
