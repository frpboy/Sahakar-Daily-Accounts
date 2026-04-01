This Product Requirements Document (PRD) outlines a centralized, multi-user Web Application for managing daily outlet accounts.

---

# PRD: Daily Outlet Account Management System (DOAMS)

## 1. Project Overview
The goal is to build a lightweight web application that allows managers at different retail outlets to record their daily financial performance, ensuring data integrity, role-based access control, and better reporting for the administrator.

## 2. User Personas
*   **Outlet Manager:** Responsible for entering daily figures (Sales, Expenses, Stock) for their specific outlet only.
*   **Administrator (Owner):** Responsible for viewing all outlet data, managing users, and analyzing performance trends across the business.

## 3. Functional Requirements

### 3.1 Authentication & Authorization
*   **Login System:** Secure email/password login.
*   **Role-Based Access (RBAC):**
    *   Managers are restricted to viewing and editing data for their assigned outlet.
    *   Admins have global read/write access.
*   **Session Management:** Persistent login for at least 24 hours (for mobile convenience).

### 3.2 Data Entry (The Daily Form)
*   **Date Selection:** Default to current date; restricted to +/- 3 days for Managers (Admins can edit any date).
*   **Financial Inputs:**
    *   **Sale by Cash** (Numeric)
    *   **Sale by UPI** (Numeric)
    *   **Sale by Credit** (Numeric)
    *   **Total Sale** (Auto-calculated: Cash + UPI + Credit)
*   **Operational Inputs:**
    *   **Expenses** (Numeric)
    *   **Purchase** (Numeric)
    *   **Closing Stock** (Numeric)
*   **Validation:** 
    *   Fields cannot be empty (default to 0).
    *   Prevent duplicate entries for the same Date + Outlet combination.

### 3.3 Dashboard & Reporting
*   **Manager View:** A simple list of their last 7 days of entries for quick review.
*   **Admin View:** 
    *   A tabular view showing all outlets.
    *   Filter by Date Range and Outlet Name.
    *   Export to CSV/Excel capability.
    *   Monthly aggregates (Total sales per outlet per month).

---

## 4. Technical Specifications

### 4.1 The Tech Stack
*   **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui.
*   **Database:** **Neon (Postgres)**.
*   **ORM:** Drizzle ORM (optimized for serverless).
*   **Auth:** Clerk (Recommended for rapid RBAC) or Auth.js.
*   **Deployment:** Vercel.

### 4.2 Database Schema (PostgreSQL / Neon)
```sql
-- Outlets Table
CREATE TABLE outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users Table (If not using Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'manager')),
  outlet_id UUID REFERENCES outlets(id) -- Null if Admin
);

-- Daily Accounts Table
CREATE TABLE daily_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES outlets(id) NOT NULL,
  entry_date DATE NOT NULL,
  sale_cash DECIMAL(12,2) DEFAULT 0,
  sale_upi DECIMAL(12,2) DEFAULT 0,
  sale_credit DECIMAL(12,2) DEFAULT 0,
  total_sale DECIMAL(12,2) GENERATED ALWAYS AS (sale_cash + sale_upi + sale_credit) STORED,
  expenses DECIMAL(12,2) DEFAULT 0,
  purchase DECIMAL(12,2) DEFAULT 0,
  closing_stock DECIMAL(12,2) DEFAULT 0,
  submitted_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(outlet_id, entry_date) -- Data integrity constraint
);
```

---

## 5. UI/UX Design Requirements

### 5.1 Mobile-First Form
Since outlet managers often use their phones:
*   Use `inputmode="decimal"` for all numeric fields to trigger the number pad on mobile.
*   Large "Submit" buttons.
*   Success/Error "Toasts" upon submission.

### 5.2 Admin Grid
*   Sticky headers for the table.
*   Conditional formatting: Highlight rows where "Expenses" exceed a certain % of "Total Sale."

---

## 6. Non-Functional Requirements
*   **Accuracy:** Financial fields must use `Decimal` or `Numeric` types in Postgres (never `Float`) to avoid rounding errors.
*   **Performance:** The app should load the entry form in under 1 second.
*   **Offline Resilience:** (Optional/Future) Ability to cache the form if the shop's internet is unstable.

## 7. Success Metrics
*   **Zero Duplicates:** Prevent duplicate entries for the same outlet and date.
*   **Reduced Error Rate:** 100% mathematical accuracy between Cash/UPI/Credit and Total Sales.
*   **Reporting Speed:** Admin should be able to view "Total Business Sales" for the month in 2 clicks.

---

## 8. Implementation Roadmap
1.  **Phase 1:** Setup Neon DB and Drizzle Schema.
2.  **Phase 2:** Implement Clerk/Auth with Role-based redirection.
3.  **Phase 3:** Build the "Daily Entry Form" with Zod validation.
4.  **Phase 4:** Build the Admin Dashboard (Table View).
5.  **Phase 5:** Data Migration (Import historical data via CSV if needed).