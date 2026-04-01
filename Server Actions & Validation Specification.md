This specification defines the "Brain" of your application. It handles the bridge between the user's browser and your **Neon** database, ensuring that no "bad data" (like negative sales or missing dates) ever gets saved.

---

### 1. Data Validation Schema (Zod)
We use **Zod** to define exactly what a "Daily Entry" looks like. This schema runs both on the client (for instant feedback) and the server (for security).

```typescript
// src/lib/validations/entry.ts
import { z } from "zod";

export const dailyEntrySchema = z.object({
  date: z.coerce.date().max(new Date(), { message: "Cannot enter data for future dates" }),
  outletId: z.string().uuid(),
  
  // Sales (Coerce converts string inputs from the form to numbers)
  saleCash: z.coerce.number().min(0, "Cash cannot be negative").default(0),
  saleUpi: z.coerce.number().min(0, "UPI cannot be negative").default(0),
  saleCredit: z.coerce.number().min(0, "Credit cannot be negative").default(0),
  
  // Operations
  expenses: z.coerce.number().min(0).default(0),
  purchase: z.coerce.number().min(0).default(0),
  closingStock: z.coerce.number().min(0).default(0),
}).refine((data) => {
  // Logic Check: Total Sale should ideally be > 0 if there are operations
  return (data.saleCash + data.saleUpi + data.saleCredit) >= 0;
}, {
  message: "Invalid sales totals",
  path: ["saleCash"], 
});

export type DailyEntryInput = z.infer<typeof dailyEntrySchema>;
```

---

### 2. The Server Action (`submitDailyAccount`)
This is the function that handles the database write. It incorporates the **RBAC logic** we discussed earlier.

```typescript
// src/lib/actions/accounts.ts
"use server"

import { db } from "@/db";
import { dailyAccounts } from "@/db/schema";
import { dailyEntrySchema } from "@/lib/validations/entry";
import { getSessionContext } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function submitDailyAccount(rawData: unknown) {
  try {
    // 1. Authenticate & Authorize
    const { userId, outletId, isAdmin } = await getSessionContext();

    // 2. Validate Data
    const validatedData = dailyEntrySchema.parse(rawData);

    // 3. Security Enforcement: Force the outletId if the user is a manager
    const targetOutletId = isAdmin ? validatedData.outletId : outletId;
    
    if (!targetOutletId) {
      return { success: false, error: "No outlet assigned to user." };
    }

    // 4. Database Insert (Upsert logic to prevent duplicates)
    await db.insert(dailyAccounts).values({
      date: validatedData.date.toISOString().split('T')[0], // Format for Postgres DATE
      outletId: targetOutletId,
      saleCash: validatedData.saleCash.toString(), // Drizzle numeric uses strings to maintain precision
      saleUpi: validatedData.saleUpi.toString(),
      saleCredit: validatedData.saleCredit.toString(),
      expenses: validatedData.expenses.toString(),
      purchase: validatedData.purchase.toString(),
      closingStock: validatedData.closingStock.toString(),
      createdBy: userId,
    }).onConflictDoUpdate({
      target: [dailyAccounts.date, dailyAccounts.outletId],
      set: {
        saleCash: validatedData.saleCash.toString(),
        saleUpi: validatedData.saleUpi.toString(),
        saleCredit: validatedData.saleCredit.toString(),
        expenses: validatedData.expenses.toString(),
        purchase: validatedData.purchase.toString(),
        closingStock: validatedData.closingStock.toString(),
        updatedAt: new Date(),
      }
    });

    // 5. Clear Cache so the UI updates
    revalidatePath("/reports");
    revalidatePath("/entry");

    return { success: true, message: "Entry saved successfully!" };

  } catch (error: any) {
    console.error("Submission Error:", error);
    
    if (error.name === "ZodError") {
      return { success: false, error: "Invalid data submitted. Please check all fields." };
    }
    
    return { success: false, error: "Database error. Please try again later." };
  }
}
```

---

### 3. Key Technical Decisions Explained

#### A. The "Upsert" Strategy (`onConflictDoUpdate`)
We enforce one row per outlet per day in the database. 
*   If a manager submits data for April 1st, then realizes they made a mistake and submits *again*, the code **updates** the existing row instead of creating a second one. This keeps your "Total Monthly Sales" accurate.

#### B. String vs Number Precision
Notice that `saleCash` is saved as `.toString()` before hitting Drizzle. 
*   **Reason:** Neon/PostgreSQL `NUMERIC` types are returned as strings in JavaScript to avoid the floating-point math errors (e.g., `0.1 + 0.2 != 0.3`). 
*   **Guideline:** Always use strings for transport and `Big.js` or standard integer math for display.

#### C. Validation Feedback
The Server Action returns an object: `{ success: boolean, message?: string, error?: string }`.
*   This allows you to use a **Toast** (like `sonner` or `react-hot-toast`) in your UI to show a green "Success" or red "Error" popup without refreshing the page.

---

### 4. Frontend Usage Example
In your React component, you simply call the action:

```tsx
const onSubmit = async (values: DailyEntryInput) => {
  const result = await submitDailyAccount(values);
  if (result.success) {
    toast.success(result.message);
  } else {
    toast.error(result.error);
  }
};
```

---

### Final Blueprint Doc: Deployment & Environment Checklist
This is the last piece. It covers how to get your app off your computer and onto a public URL so your managers can start typing. 

**Shall I generate the Deployment Checklist?**