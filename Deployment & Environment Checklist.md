This final checklist ensures your application is "Production-Ready." Moving from `localhost` to a live URL involves securing your keys, optimizing your database connections, and configuring your authentication provider for a real-world environment.

---

### 1. Environment Variables (.env.local vs. Production)
You will need to copy these from your local machine to the **Vercel Project Settings**.

| Variable Name | Source | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon Console | The **Pooled** connection string (ends in `-pooler`). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard | Public key for the frontend. |
| `CLERK_SECRET_KEY` | Clerk Dashboard | Private key for the backend (Keep secret!). |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Manual | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Manual | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Manual | `/dashboard` or `/entry` |

---

### 2. Neon Database Production Setup
*   **Use Connection Pooling:** Serverless functions (Vercel) create many short-lived connections. In Neon, always use the connection string labeled **"Pooled connection"**.
*   **Branching:** Create a `main` branch in Neon for production. Keep your `dev` branch for testing new features.
*   **SSL:** Ensure your connection string includes `?sslmode=require` to encrypt data between Vercel and Neon.

---

### 3. Clerk Production Configuration
Clerk has separate "Development" and "Production" instances. 
*   **Switch to Production:** Create a new "Production" instance in the Clerk Dashboard.
*   **Update Keys:** Replace your `test_` keys with `live_` keys in Vercel.
*   **Allowed Origins:** Add your production domain (e.g., `daily-accounts.vercel.app`) to the Clerk "Allowed Redirect URIs" list.
*   **User Metadata:** Manually assign the `role` and `outletId` metadata to your managers in the Clerk Dashboard once they sign up.

---

### 4. Drizzle Migration Strategy
**Important:** Do **not** use `drizzle-kit push` in production. It is "destructive" and can cause data loss.

1.  **Generate SQL:** Run `npm run db:generate` locally to create migration files in `/drizzle`.
2.  **Run Migration:** Create a production-only script to run migrations.
    ```typescript
    // src/db/migrate.ts
    import { migrate } from "drizzle-orm/neon-http/migrator";
    // ... logic to run migrations against the production DB
    ```
3.  **CI/CD:** You can set Vercel to run `npm run db:migrate` automatically during the build step.

---

### 5. Vercel Deployment Settings
*   **Framework Preset:** Ensure "Next.js" is selected.
*   **Root Directory:** Typically `./`.
*   **Build Command:** `next build`.
*   **Install Command:** `npm install`.

---

### 6. Post-Deployment Verification (Checklist)
Once the site is live, perform these tests:

1.  **Auth Check:** Try to access `/entry` without logging in. (Should redirect to Sign-in).
2.  **Role Check:** Log in as a **Manager**. Verify you *cannot* see other outlets' data.
3.  **Role Check:** Log in as an **Admin**. Verify you *can* see all outlets.
4.  **Submission Check:** Submit one day's account. Check the Neon Console to see if the row appeared with the correct values.
5.  **Validation Check:** Try to submit a negative number or a future date. (The app should block it).
6.  **Mobile Check:** Open the site on a phone. Ensure the numeric keypad pops up for sales entries.

---

### 7. Maintenance & Backups
*   **Neon Backups:** Neon automatically takes point-in-time backups. Familiarize yourself with the "Restore" button just in case.
*   **Error Logging:** Consider adding **Sentry** (free tier) to your Next.js app to get notified if a database query fails for a manager in the field.

---

### Final Summary of the "Daily Outlet Account" App:
1.  **Stack:** Next.js + Neon + Drizzle + Clerk + Shadcn.
2.  **Security:** RBAC via Clerk metadata and Server Action enforcement.
3.  **Performance:** Serverless Postgres with pooling for instant loads.
4.  **Integrity:** Zod validation + Postgres Decimal types for financial accuracy.

**You now have the full architecture and documentation to build this app. Do you have any final questions about the implementation?**