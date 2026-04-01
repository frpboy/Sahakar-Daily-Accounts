This guide covers how to initialize your **Neon** database with your specific outlets (Melattur, Tirur, etc.) and how to manage your database schema as your app grows.

### 1. The Migration Workflow (Drizzle Kit)
Drizzle uses two main commands. You should add these to your `package.json` for easy access.

*   **`generate`**: Scans your `schema.ts` and creates SQL files in a `/drizzle` folder.
*   **`push`**: Directly updates your Neon database to match your schema (best for rapid development).
*   **`migrate`**: Runs the generated SQL files against the database (best for production).

**Add these to `package.json`:**
```json
"scripts": {
  "db:generate": "drizzle-kit generate:pg",
  "db:push": "drizzle-kit push:pg",
  "db:studio": "drizzle-kit studio",
  "db:seed": "npx tsx src/db/seed.ts"
}
```

---

### 2. The Seeding Script (`src/db/seed.ts`)
This script will populate your `outlets` table with the outlet names. It uses an "Upsert" logic so you can run it multiple times without creating duplicates.

```typescript
// src/db/seed.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const INITIAL_OUTLETS = [
  { name: "MELATTUR" },
  { name: "MAKKARAPPARAMBU" },
  { name: "TIRUR" },
  { name: "KARINKALLATHANI" },
  { name: "MANJERI" }
];

async function main() {
  console.log("🌱 Seeding database...");

  try {
    // 1. Seed Outlets
    for (const outlet of INITIAL_OUTLETS) {
      await db
        .insert(schema.outlets)
        .values(outlet)
        .onConflictDoNothing({ target: schema.outlets.name });
      console.log(`✅ Outlet ensured: ${outlet.name}`);
    }

    // 2. Optional: Seed a default Admin user reference if needed
    // (Actual auth happens in Clerk, but you might want a record here)
    
    console.log("✨ Seeding completed successfully.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
```

---

### 3. Handling Schema Changes (Migrations)
When you want to add a new column (e.g., you decide to track "Tax Collected" or "Discount Given"), follow this workflow:

1.  **Update `schema.ts`:** Add the new column definition.
2.  **Run `npm run db:generate`:** Drizzle creates a new `.sql` file in your migrations folder.
3.  **Run `npm run db:push`:** Your Neon database is instantly updated.

---

### 4. Implementation Guidelines for Data Integrity
Since this is financial data, you must be careful with migrations that involve **deleting** or **renaming** columns.

*   **Avoid "Drop Column":** If you want to stop using "Closing Stock," don't delete the column immediately. Mark it as deprecated in your code first.
*   **Default Values:** Always provide a default for numeric fields (e.g., `.default("0")`) so your existing historical records don't break when you add a new field.
*   **Neon Branching:** Before running a major migration, use the Neon CLI to create a "shadow" branch:
    ```bash
    neon branch create my-migration-test
    ```
    Test your migration there first. If it works, apply it to `main`.

### 5. Managing the "Outlet Name" mapping
Outlet names are strings, but in your database they are IDs. 
*   When you seed, Neon will generate a **UUID** for each outlet. 
*   You will need to copy these IDs into your **Clerk User Metadata** so the app knows which manager belongs to which UUID.

**How to run it right now:**
1. Ensure your `.env.local` has `DATABASE_URL` from Neon.
2. Run `npm run db:push` to create the tables.
3. Run `npm run db:seed` to populate the outlets.

**Next, should I provide the "Server Actions & Validation Specification" (the code that handles the actual data submission)?**