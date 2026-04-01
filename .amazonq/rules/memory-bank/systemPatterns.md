# System Patterns

## Architecture
Next.js App Router (full-stack) — no separate API server. Server Actions handle all DB writes.

## Folder Structure
```
src/
├── app/
│   ├── (auth)/          # Clerk sign-in/sign-up routes
│   ├── (dashboard)/
│   │   ├── entry/       # Daily entry form page
│   │   ├── reports/     # Admin data table page
│   │   └── layout.tsx   # Sidebar/Nav
│   ├── api/             # Clerk webhook sync
│   └── page.tsx         # Landing / redirect logic
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── forms/           # DailyEntryForm.tsx
│   ├── tables/          # AccountsDataTable.tsx
│   └── shared/          # Navbar, Sidebar, UserButton
├── db/
│   ├── index.ts         # Neon client + Drizzle init
│   └── schema.ts        # Table definitions
├── lib/
│   ├── actions/         # Server Actions (submitDailyAccount, getDailyEntries)
│   ├── validations/     # Zod schemas (dailyEntrySchema)
│   └── utils.ts         # cn(), formatters
└── middleware.ts         # Clerk route protection
```

## Key Patterns

### RBAC via Clerk Metadata
- Admin: `{ role: "admin" }`
- Manager: `{ role: "manager", outletId: "<uuid>" }`
- Extracted server-side via `getSessionContext()` in `src/lib/auth-utils.ts`

### Data Isolation Rule
Every DB read for managers MUST include `.where(eq(dailyAccounts.outletId, outletId))`.
Never fetch all and filter in the browser.

### Mutation Security (ID Swap Prevention)
Server Actions ignore `outletId` from form data for managers.
Always use `outletId` from session metadata:
```ts
const targetOutletId = isAdmin ? formData.outletId : outletId; // from session
```

### Upsert Strategy
`onConflictDoUpdate` on `(outlet_id, date)` — re-submitting the same day updates the row instead of erroring or duplicating.

### Total Sale Calculation
- DB: `GENERATED ALWAYS AS (sale_cash + sale_upi + sale_credit) STORED` column
- UI: Calculated live via React Hook Form `watch()` — never trusted from client on save

### Numeric Precision
- DB type: `NUMERIC(12,2)` — never FLOAT
- Drizzle transport: values sent as `.toString()` strings
- Display: parse back to number for UI rendering

### Middleware Route Guard
```ts
// src/middleware.ts
// Managers accessing /reports → redirect to /entry
```

### Cache Invalidation
After every successful write: `revalidatePath("/reports")` + `revalidatePath("/entry")`
