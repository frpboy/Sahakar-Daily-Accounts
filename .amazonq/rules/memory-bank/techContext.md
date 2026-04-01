# Tech Context

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Full-stack, Server Actions |
| Language | TypeScript | Required for financial type safety |
| Styling | Tailwind CSS + shadcn/ui | Data Table, Form, Input components |
| Icons | Lucide React | |
| Database | Neon (Serverless Postgres) | Use **pooled** connection string in prod |
| ORM | Drizzle ORM + Drizzle Kit | Type-safe queries, migrations |
| Auth | Clerk | RBAC via `publicMetadata` |
| Validation | Zod | Client + server, `z.coerce.number()` for form inputs |
| Forms | React Hook Form + `@hookform/resolvers` | Live total calculation via `watch()` |
| Tables | TanStack Table (React Table) | Admin dashboard sorting/filtering/pagination |
| State | Zustand (if form grows complex) | |
| Toasts | sonner or react-hot-toast | |
| Deployment | Vercel | Framework preset: Next.js |
| Version Control | GitHub → Vercel CI/CD | Push to main = auto deploy |

## Install Commands
```bash
npx create-next-app@latest daily-accounts --typescript --tailwind --eslint
npx shadcn-ui@latest init
npm install drizzle-orm @neondatabase/serverless @clerk/nextjs zod react-hook-form @hookform/resolvers
npm install -D drizzle-kit
```

## Environment Variables
| Variable | Source |
|---|---|
| `DATABASE_URL` | Neon Console — use **pooled** string (ends in `-pooler`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard |
| `CLERK_SECRET_KEY` | Clerk Dashboard (keep secret) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/entry` (manager) or `/dashboard` |

## DB Scripts (package.json)
```json
"db:generate": "drizzle-kit generate:pg",
"db:push":     "drizzle-kit push:pg",
"db:studio":   "drizzle-kit studio",
"db:seed":     "npx tsx src/db/seed.ts"
```
> ⚠️ Never run `db:push` in production — use `db:migrate` with generated SQL files.

## Drizzle Schema (src/db/schema.ts)
```ts
export const outlets = pgTable("outlets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  managerId: text("manager_id"), // Clerk User ID, optional
});

export const dailyAccounts = pgTable("daily_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  date: date("date").notNull(),
  saleCash:     numeric("sale_cash",     { precision: 12, scale: 2 }).default("0"),
  saleUpi:      numeric("sale_upi",      { precision: 12, scale: 2 }).default("0"),
  saleCredit:   numeric("sale_credit",   { precision: 12, scale: 2 }).default("0"),
  expenses:     numeric("expenses",      { precision: 12, scale: 2 }).default("0"),
  purchase:     numeric("purchase",      { precision: 12, scale: 2 }).default("0"),
  closingStock: numeric("closing_stock", { precision: 12, scale: 2 }).default("0"),
  createdBy: text("created_by").notNull(), // Clerk User ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniq: unique().on(t.outletId, t.date), // Prevents duplicate entries
}));
```
> Note: `total_sale` is a Postgres `GENERATED ALWAYS AS` column — not in Drizzle schema directly, or computed in query.
