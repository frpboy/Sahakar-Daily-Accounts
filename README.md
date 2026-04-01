# Daily Outlet Account Management System (DOAMS)

A modern, full-stack web application for managing daily outlet accounts with role-based access control, real-time validation, and comprehensive reporting.

## Overview

DOAMS is built to help retail outlet managers record their daily financial performance with strict data integrity, multi-tenancy support, and admin-level reporting across all outlets.

### Key Features

- **Daily Account Entry**: Easy-to-use mobile-first form for entering sales, expenses, and operational data
- **Role-Based Access Control**: Managers see only their outlet data; Admins have full visibility
- **Real-Time Calculations**: Automatic total sales calculations and profit margins
- **Comprehensive Reports**: Admin dashboard with filtering, sorting, and CSV export
- **Data Integrity**: Prevents duplicate entries for same date + outlet combination
- **Financial Precision**: Uses DECIMAL types to avoid floating-point errors
- **Secure Authentication**: Integrated with Neon Auth for user management and multi-tenancy

## Tech Stack

| Layer          | Technology               | Purpose                           |
| -------------- | ------------------------ | --------------------------------- |
| **Frontend**   | Next.js 14+              | React framework with App Router   |
| **Styling**    | Tailwind CSS + shadcn/ui | Component library & utilities     |
| **Database**   | Neon (PostgreSQL)        | Serverless database               |
| **ORM**        | Drizzle ORM              | Type-safe database queries        |
| **Auth**       | Neon Auth                | Multi-user login & RBAC           |
| **Validation** | Zod                      | Schema validation                 |
| **Tables**     | TanStack Table           | Data table with sorting/filtering |
| **Host**       | Vercel                   | Production deployment             |

## Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Public auth routes
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/               # Protected dashboard routes
│   │   ├── entry/                 # Daily entry form page
│   │   └── reports/               # Admin reporting page
│   └── layout.tsx
├── components/
│   ├── forms/                     # Form components
│   │   └── DailyEntryForm.tsx
│   ├── tables/                    # Table components
│   │   └── AccountsDataTable.tsx
│   ├── ui/                        # shadcn/ui components
│   └── shared/                    # Shared layout components
├── db/
│   ├── schema.ts                  # Database schema
│   ├── index.ts                   # Database client
│   └── seed.ts                    # Database seeding
├── lib/
│   ├── actions/                   # Server Actions
│   ├── validations/               # Zod schemas
│   ├── auth-utils.ts              # Auth utilities
│   └── utils.ts                   # Helper utilities
├── middleware.ts                  # Neon Auth middleware
├── globals.css                    # Global styles
└── types/                         # TypeScript definitions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon account (for PostgreSQL database)
- Neon Auth account (for authentication)
- Vercel account (for deployment)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd daily-accounts
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**
   Copy `.env.example` to `.env.local` and fill in your credentials:

   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `DATABASE_URL` - Neon pooled connection string
   - `NEXT_PUBLIC_Neon Auth_PUBLISHABLE_KEY`
   - `Neon Auth_SECRET_KEY`

4. **Setup database**

   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Database Setup

### Neon Connection

1. Create a Neon project at https://neon.tech
2. Get your pooled connection string:
   - Go to Project Settings → Connection string
   - Copy the **Pooled connection** string (ends with `-pooler`)
   - Paste it into `DATABASE_URL` in `.env.local`

### Seeding Initial Data

The seed script creates 5 outlets:

- MELATTUR
- MAKKARAPPARAMBU
- TIRUR
- KARINKALLATHANI
- MANJERI

Run seeding after pushing schema:

```bash
npm run db:seed
```

## Authentication Setup

### Neon Auth Configuration

1. Create a Neon Auth app at https://dashboard.Neon Auth.com
2. Copy your API keys to `.env.local`
3. Configure redirect URLs:
   - Sign-in: `http://localhost:3000/sign-in`
   - Sign-up: `http://localhost:3000/sign-up`
   - After sign-in: `/entry`

### User Metadata (RBAC)

In Neon Auth Dashboard, set custom metadata for each user:

**Admin User:**

```json
{
  "role": "admin"
}
```

**Manager User:**

```json
{
  "role": "manager",
  "outletId": "uuid-from-database"
}
```

To find outlet UUIDs, check your Neon database:

```sql
SELECT id, name FROM outlets;
```

## Development

### Database Migrations

When you update the schema:

1. Modify `src/db/schema.ts`
2. Generate migration:
   ```bash
   npm run db:generate
   ```
3. Push to database:
   ```bash
   npm run db:push
   ```
4. Or apply migration:
   ```bash
   npm run db:migrate
   ```

### Available Scripts

```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run db:generate   # Generate migrations
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio
npm run db:seed       # Seed initial data
npm run format        # Format code with Prettier
```

## Features

### Manager View

- Daily entry form with auto-calculated total sales
- View last 7 days of entries
- Mobile-first design with number input support

### Admin View

- View all outlet entries in a table
- Filter by outlet and date range
- Sort by any column
- Export to CSV
- See monthly aggregates
- Monitor profit margins

### Security

- Server-side RBAC enforcement
- Middleware route protection
- ID swapping prevention
- Secure numeric handling with DECIMAL types

## Deployment

### Vercel Deployment

1. **Push to GitHub** - Connect your repo to Vercel

2. **Create Vercel Project**
   - Import from GitHub
   - Framework: Next.js
   - Root: ./
   - Build Command: `next build`

3. **Configure Environment Variables** in Vercel Project Settings:

   ```
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_Neon Auth_PUBLISHABLE_KEY=pk_live_...
   Neon Auth_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_Neon Auth_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_Neon Auth_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_Neon Auth_AFTER_SIGN_IN_URL=/entry
   ```

4. **Deploy** - Vercel will auto-deploy on git push

### Production Checklist

- [ ] Use Neon Production connection string
- [ ] Switch Neon Auth to Production instance
- [ ] Add production domain to Neon Auth allowed origins
- [ ] Configure CORS for your domain
- [ ] Set up database backups
- [ ] Enable SSL verification
- [ ] Configure error logging (Sentry optional)
- [ ] Test all features in production

## API Reference

### Server Actions

All server actions are located in `src/lib/actions/accounts.ts`

#### `submitDailyAccount(data)`

Submit or update a daily account entry.

**Parameters:**

- `date: Date` - Entry date
- `outletId: string` - Outlet UUID
- `saleCash: number` - Cash sales
- `saleUpi: number` - UPI sales
- `saleCredit: number` - Credit sales
- `expenses: number` - Daily expenses
- `purchase: number` - Purchase amount
- `closingStock: number` - Closing stock

**Returns:**

```json
{
  "success": boolean,
  "message": "success message",
  "error": "error message"
}
```

#### `getDailyEntries()`

Fetch all entries (filtered by user role).

Returns array of entries with outlet data.

#### `getAllOutlets()`

Fetch all outlets.

Returns array of outlet objects with id and name.

## Troubleshooting

### "Too many connections" Error

- Ensure you're using Neon's **pooled connection** string (ends with `-pooler`)
- Check `.env.local` has correct `DATABASE_URL`

### Duplicate Entries

- Database has unique constraint on `(outlet_id, date)`
- Trying to submit same date + outlet will update existing entry

### RBAC Not Working

- Verify Neon Auth user has custom metadata set correctly
- Check metadata key names match exactly (`role`, `outletId`)
- Clear browser cache and re-login if changed metadata

### Forms Not Working

- Ensure `NEXT_PUBLIC_Neon Auth_PUBLISHABLE_KEY` is in `.env.local`
- Check Neon Auth redirect URLs are configured correctly

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and formatting
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review documentation files in workspace
3. Check Neon and Neon Auth documentation
4. Open an issue on GitHub

---

**Built with ❤️ for efficient outlet management**
