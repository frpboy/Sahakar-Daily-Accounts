# Project Brief: Sahakar Daily Accounts (DOAMS)

## Purpose
A secure, multi-user web app for managing daily outlet financial accounts.

## Core Users
- **Outlet Manager:** Enters daily figures (Sales, Expenses, Stock) for their assigned outlet only.
- **Administrator (Owner):** Views all outlet data, manages users, analyzes performance across all outlets.

## Key Outcomes
- Zero duplicate entries (enforced by DB unique constraint on `outlet_id + date`)
- 100% math accuracy for Cash + UPI + Credit = Total Sale
- Admin can view monthly totals in 2 clicks
- Mobile-friendly for outlet staff using phones

## Outlets (5 total)
MELATTUR, MAKKARAPPARAMBU, TIRUR, KARINKALLATHANI, MANJERI and more to come 
