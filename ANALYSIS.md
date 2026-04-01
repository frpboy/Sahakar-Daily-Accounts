# Codebase Analysis & Refactoring Plan: Sahakar-Daily-Accounts

## 📊 Project Overview
**Sahakar-Daily-Accounts** is a Daily Outlet Account Management System (DOAMS) built with **Next.js 14 (App Router)**, **TypeScript**, **Drizzle ORM**, and **Neon (PostgreSQL)**.

---

## 🔍 Codebase Analysis

### 1. Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle ORM
- **Authentication**: Transitioning from **Clerk** to **Neon Auth**.
- **UI Components**: shadcn/ui + Tailwind CSS
- **Forms/Validation**: React Hook Form + Zod
- **Data Tables**: TanStack Table

### 2. Current Migration Status
The codebase is currently in a "hybrid" state:
- `src/lib/neon-auth-mock.tsx` contains mock logic for development.
- `src/lib/auth-utils.ts` is ready for implementation but currently throws errors.
- `package.json` still reflects Clerk dependencies.

---

## 🛠️ Refactoring Plan

### Phase 1: Authentication Migration
1.  **Remove Clerk Dependency**: Uninstall `@clerk/nextjs` and remove all imports.
2.  **Implement Real Neon Auth**: Replace `neon-auth-mock.tsx` logic with the real SDK client integration.
3.  **Secure Server Actions**: Update `getSessionContext()` to verify the real session token from headers/cookies.

### Phase 2: Enterprise "Accounts" Module
1.  **Chart of Accounts**: Added tables (`account_categories`, `account_groups`, `chart_of_accounts`) to `src/db/schema.ts`. ✅
2.  **Navigation**: Added navigation link to `TopNav.tsx`. ✅
3.  **UI**: Implemented `/accounts/chart-of-accounts` with enterprise accounting structure. ✅

---

## 🚀 Execution Strategy
I will proceed with the **Authentication Migration** first as it is critical for functionality.
