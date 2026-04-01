# Product Context

## Problem Being Solved
Outlet managers needed a centralized system for daily financial entries. The key issues to solve:
- Accidental overwrites / duplicate rows
- No access control (any user could see/edit any outlet)
- Manual, error-prone Total Sale calculations
- No structured reporting for the owner

## How It Should Work

### Manager Flow
1. Log in → redirected to `/entry`
2. Select date (default: today; restricted to ±3 days)
3. Enter: Sale by Cash, Sale by UPI, Sale by Credit, Expenses, Purchase, Closing Stock
4. Total Sale auto-calculates live (Cash + UPI + Credit)
5. Submit → toast confirmation; data saved to Neon DB
6. View last 7 days of their own entries

### Admin Flow
1. Log in → redirected to `/reports` (or `/dashboard`)
2. See tabular view of all outlets, all dates
3. Filter by date range and outlet name
4. Export to CSV/Excel
5. View monthly aggregates per outlet
6. Can enter/edit data for any outlet on any date

## UX Principles
- Mobile-first: `inputmode="decimal"` on all numeric fields (triggers number pad)
- Large submit buttons
- Live total calculation while typing
- Toast notifications (success = green, error = red)
- Warning (not block) if closing stock drops >50% vs. yesterday
- Conditional row highlighting in admin table when expenses exceed a threshold % of total sale
