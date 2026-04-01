Building a financial app for multiple outlets requires a focus on **data integrity** and **security**.

### 1. Database & Precision Guidelines
*   **Never use Float/Number for Money:** In your Neon/Postgres schema, use `DECIMAL(12, 2)` or `NUMERIC`. JavaScript’s `number` type (64-bit float) causes rounding errors (e.g., `0.1 + 0.2` becoming `0.30000000000000004`).
*   **Unique Constraints:** Apply a unique constraint on `(outlet_id, date)`. This prevents a manager from accidentally submitting two records for the same day, which would double your "Total Sales" reports.
*   **Server-Side Calculations:** Never trust the "Total Sale" sent from the frontend. Receive the individual values (Cash, UPI, Credit) and recalculate the Total on the server before saving to ensure accuracy.

### 2. Multi-User Security Guidelines
*   **The "Tenancy" Filter:** Every single database query must include a `.where(eq(schema.dailyAccounts.outletId, userOutletId))`. Never fetch "all" records and filter them in the browser.
*   **Role-Based Access Control (RBAC):**
    *   **Managers:** Permissions = `Create` (Own Outlet), `Read` (Own Outlet), `Update` (Own Outlet - only for 24 hours).
    *   **Admins:** Permissions = `Read` (All), `Update` (All), `Delete` (All).
*   **Metadata over Hardcoding:** Use **Clerk Metadata** to store the user's `outlet_id`. This allows your code to stay generic while the Auth provider handles the user-to-outlet mapping.

### 3. Data Entry UI (UX) Guidelines
*   **The "Numpad" Trick:** For all numeric inputs, use `<input type="number" inputmode="decimal" />`. This forces mobile phones to open the number pad instead of the full keyboard, making entry 3x faster for staff.
*   **Immediate Feedback:** As the manager types Cash, UPI, and Credit, show a "Live Total" on the screen. If the total looks wrong, they can fix it before clicking Submit.
*   **Drafts & Soft Errors:** If a manager tries to submit a "Closing Stock" that is 50% lower than yesterday's, show a warning: *"Are you sure? This is a large drop."* but don't necessarily block them.

### 4. Code Structure Guidelines
*   **Use Server Actions:** In Next.js, use `useServerAction`. It keeps your data logic and validation in one file and handles the POST request automatically.
*   **Zod Validation:** Define a strict schema.
    ```typescript
    const dailyEntrySchema = z.object({
      sale_cash: z.coerce.number().nonnegative(),
      expenses: z.coerce.number().nonnegative(),
      date: z.string().pipe( z.coerce.date() )
    });
    ```
*   **Zustand for State:** If your form gets complex (e.g., adding line-item expenses), use **Zustand** for lightweight state management instead of drilling props through 10 components.

### 5. Deployment & Reliability Guidelines
*   **Database Branching:** Use Neon's branching feature. Create a `dev` branch for your database so you can test new columns (like adding "Tax" or "Discounts" later) without affecting the live outlet data.
*   **Audit Logs:** Store a `created_by` (user ID) and `updated_at` timestamp for every row. If a value changes mysteriously, you need to know who changed it and when.
*   **Error Handling:** Use a library like `sonner` for "Toasts." If the database is down or a submission fails, the user must get a clear, red error message so they don't assume the data was saved.

### 6. Data Migration
*   **The "Initial Load":** Import historical data from CSV using a one-time Drizzle script with `db.insert().values(csvData)`.
*   **Consistency Check:** Verify calculations and data integrity after migration.

**Which part would you like to see a code implementation for first? (e.g., The Clerk Auth setup or the Drizzle/Neon schema?)**