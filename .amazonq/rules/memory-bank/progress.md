# Progress

## What Works (Completed)
- Full architecture and specification documented
- Database schema designed (outlets + daily_accounts with UNIQUE constraint)
- RBAC strategy defined (Clerk publicMetadata)
- Server Action pattern specified (`submitDailyAccount` with upsert)
- Zod validation schema defined (`dailyEntrySchema`)
- Seeding script written for 5 outlets
- Deployment checklist finalized

## What's Left to Build
- [ ] Next.js app initialization
- [ ] `drizzle.config.ts` + `src/db/schema.ts` + `src/db/index.ts`
- [ ] `src/db/seed.ts` (script ready in docs)
- [ ] Clerk setup + `src/middleware.ts` route protection
- [ ] `src/lib/auth-utils.ts` — `getSessionContext()` helper
- [ ] `src/lib/validations/entry.ts` — Zod schema
- [ ] `src/lib/actions/accounts.ts` — `submitDailyAccount` + `getDailyEntries`
- [ ] `src/components/forms/DailyEntryForm.tsx`
- [ ] `src/components/tables/AccountsDataTable.tsx` (TanStack Table)
- [ ] `/entry` page (manager form)
- [ ] `/reports` page (admin table with filters + CSV export)
- [ ] Monthly aggregates query
- [ ] CSV/Excel export feature
- [ ] Historical data migration via CSV import

## Key Decisions Made
| Decision | Choice | Reason |
|---|---|---|
| Auth | Clerk | Built-in metadata for RBAC, fast setup |
| DB | Neon Postgres | Serverless pooling, branching for dev/prod |
| ORM | Drizzle | Lightweight, type-safe, serverless-optimized |
| Money type | NUMERIC(12,2) | Avoids JS float rounding errors |
| Duplicate prevention | DB UNIQUE(outlet_id, date) | Enforced at DB level, not just app level |
| Write strategy | Upsert (onConflictDoUpdate) | Re-submission updates instead of errors |
| outletId source | Session metadata only | Prevents ID-swap attacks from client |
| Total Sale | DB generated column | Single source of truth, no client trust |
| Prod migrations | `db:migrate` (not `db:push`) | `push` is destructive in production |

## Known Constraints
- Managers: date entry restricted to ±3 days from today
- Managers: can only update their own outlet's data within 24 hours of entry
- All numeric DB fields use string transport in Drizzle (NUMERIC → string in JS)
- Production Clerk instance needs separate keys from development instance
