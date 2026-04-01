For a **Next.js + Neon + Drizzle + Clerk** stack, you should follow a feature-based folder structure. This keeps your database logic separate from your UI components.

### 1. File Tree Structure
```text
daily-accounts/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login/Signup routes (Clerk)
│   │   ├── (dashboard)/        # Main application pages
│   │   │   ├── entry/          # Daily entry form page
│   │   │   ├── reports/        # Admin data table page
│   │   │   └── layout.tsx      # Sidebar/Navigation
│   │   ├── api/                # Webhooks (e.g., Clerk sync)
│   │   └── page.tsx            # Landing/Redirect logic
│   ├── components/
│   │   ├── ui/                 # Shadcn/ui components
│   │   ├── forms/              # DailyEntryForm.tsx
│   │   ├── tables/             # AccountsDataTable.tsx
│   │   └── shared/             # Navbar, Sidebar, UserButton
│   ├── db/
│   │   ├── index.ts            # Neon client & Drizzle init
│   │   └── schema.ts           # Database table definitions
│   ├── lib/
│   │   ├── actions/            # Server Actions (submitEntry, etc.)
│   │   ├── validations/        # Zod schemas (entrySchema)
│   │   └── utils.ts            # Tailwind merge, formatting
│   └── middleware.ts           # Clerk auth protection
├── drizzle.config.ts           # Drizzle migration config
├── .env.local                  # Neon URL, Clerk Keys
└── package.json
```

---

### 2. Database Structure (Drizzle Schema)
In `src/db/schema.ts`, you need to define the relationship between outlets and their daily records.

```typescript
import { pgTable, text, timestamp, date, numeric, uuid } from "drizzle-orm/pg-core";

export const outlets = pgTable("outlets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // e.g., "Melattur"
  managerId: text("manager_id"), // Optional: Link to Clerk User ID
});

export const dailyAccounts = pgTable("daily_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  date: date("date").notNull(),
  
  // Sales
  saleCash: numeric("sale_cash", { precision: 12, scale: 2 }).default("0"),
  saleUpi: numeric("sale_upi", { precision: 12, scale: 2 }).default("0"),
  saleCredit: numeric("sale_credit", { precision: 12, scale: 2 }).default("0"),
  
  // Operations
  expenses: numeric("expenses", { precision: 12, scale: 2 }).default("0"),
  purchase: numeric("purchase", { precision: 12, scale: 2 }).default("0"),
  closingStock: numeric("closing_stock", { precision: 12, scale: 2 }).default("0"),
  
  createdBy: text("created_by").notNull(), // Clerk User ID
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

### 3. Data Flow Structure (Server Actions)
Instead of building a separate API (`/api/submit`), use **Server Actions**. This allows you to call functions directly from your form.

```typescript
// src/lib/actions/accounts.ts
"use server"

import { db } from "@/db";
import { dailyAccounts } from "@/db/schema";
import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

export async function createDailyEntry(data: any) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  // Logic to save to Neon
  await db.insert(dailyAccounts).values({
    ...data,
    createdBy: userId,
  });

  revalidatePath("/reports"); // Clears cache so table updates
}
```

---

### 4. Logic Structure (Calculations)
Don't store "Total Sale" in the database as a raw column if you can avoid it. Instead, calculate it:
1.  **In the DB:** Use a `Generated Column` (Postgres feature) to sum `cash + upi + credit`.
2.  **In the UI:** Use a `useEffect` or `watch` from React Hook Form to show the sum to the manager while they type.

---

### 5. Multi-Login Structure (Clerk)
You will use **Clerk Public Metadata** to associate a user with an outlet.

*   **Manager User:** Metadata = `{ "role": "manager", "outletId": "uuid-123" }`
*   **Admin User:** Metadata = `{ "role": "admin" }`

**In your code:**
```typescript
const { sessionClaims } = auth();
const userRole = sessionClaims?.metadata.role;
const userOutlet = sessionClaims?.metadata.outletId;

// If manager, only fetch data where outletId === userOutlet
// If admin, fetch everything
```

### Next Step Recommendation:
Start by setting up the **Database Schema** and **Drizzle Kit**. Once your Neon tables are live, you can build the **Form** to send data to those tables.

**Would you like the code for the `DailyEntryForm.tsx` using shadcn and React Hook Form?**