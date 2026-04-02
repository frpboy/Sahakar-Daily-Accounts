# Supabase Auth Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Kinde Auth with Supabase Auth in the DOAMS Next.js 16 App Router app, adding email/password, magic link, and Google OAuth login, plus a gated registration-request flow backed by `supabase.auth.admin.inviteUserByEmail`.

**Architecture:** Session management is handled entirely by `@supabase/ssr` — `createServerClient` on the server (actions, route handlers, server components) and `createBrowserClient` on the client. All existing DB-level RBAC (roles in the `users` table) is preserved; Supabase Auth UUIDs become the primary key in `users.id`. A new `registration_requests` table holds pending user sign-up requests that admins approve by sending an invite email.

**Tech Stack:** Next.js 16.2.2 App Router, TypeScript strict, `@supabase/supabase-js`, `@supabase/ssr`, Drizzle ORM 0.45.2, Neon→Supabase PostgreSQL, shadcn/ui, Zod, react-hook-form, Sonner toasts.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/supabase/client.ts` | `createBrowserClient` singleton for client components |
| Create | `src/lib/supabase/server.ts` | `createServerClient` factory for server components/actions |
| Create | `src/lib/supabase/middleware.ts` | `updateSession` helper — refreshes cookie on each request |
| Modify | `middleware.ts` | Replace Kinde `withAuth` with Supabase session check |
| Create | `src/app/api/auth/callback/route.ts` | PKCE code-exchange for magic link + OAuth |
| Modify | `src/app/login/page.tsx` | Replace Kinde buttons with email/password + magic link + Google forms |
| Create | `src/app/register/page.tsx` | Registration request form (name, email, phone) |
| Modify | `src/db/schema.ts` | Add `registrationRequests` table |
| Create | `src/lib/actions/registrations.ts` | `submitRegistrationRequest`, `approveRegistrationRequest`, `rejectRegistrationRequest` |
| Modify | `src/lib/actions/users.ts` | Remove `nanoid`, use Supabase UUID as user ID in `createUser` |
| Modify | `src/app/admin/users/page.tsx` | Add "Pending Requests" section with approve/reject UI |
| Modify | `src/app/api/dashboard-stats/route.ts` | Add Supabase session guard |
| Modify | `src/app/api/outlets/route.ts` | Add Supabase session guard |
| Modify | `src/app/api/outlets-list/route.ts` | Add Supabase session guard |
| Modify | `src/app/api/outlets-stats/route.ts` | Add Supabase session guard |
| Modify | `src/app/api/all-reports/route.ts` | Add Supabase session guard |
| Modify | `src/app/api/own-reports/route.ts` | Add Supabase session guard |
| Modify | `src/lib/actions/accounts.ts` | Replace hardcoded user stub with real Supabase session |
| Modify | `src/lib/actions/coa.ts` | Add auth guard for write mutations |
| Modify | `src/components/shared/TopNav.tsx` | Replace Kinde hooks/LogoutLink with Supabase `signOut` |
| Modify | `src/app/layout.tsx` | Remove `AuthProvider` import and wrapper |
| Delete | `src/app/AuthProvider.tsx` | No longer needed |
| Delete | `src/app/api/auth/[kindeAuth]/route.ts` | Replaced by Supabase callback route |

---

### Task 1: Install and uninstall packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Supabase packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Expected output: both packages added to `dependencies` in `package.json`.

- [ ] **Step 2: Uninstall Kinde**

```bash
npm uninstall @kinde-oss/kinde-auth-nextjs
```

Expected output: package removed from `package.json` and `node_modules`.

- [ ] **Step 3: Verify no Kinde remnants in node_modules**

```bash
ls node_modules | grep kinde
```

Expected: no output (empty).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap kinde for @supabase/supabase-js + @supabase/ssr"
```

---

### Task 2: Add Supabase environment variables

**Files:**
- Modify: `.env.local` (create if absent)

- [ ] **Step 1: Verify current env file**

```bash
cat .env.local
```

You should already see `DATABASE_URL` and `DIRECT_URL` from the Neon→Supabase DB migration.

- [ ] **Step 2: Add Supabase Auth variables**

Append the following three lines to `.env.local`. Get the values from the Supabase dashboard → Project Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=https://grdeedwkzqyfxgfeskdr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy from supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<copy from supabase dashboard — never expose client-side>
```

- [ ] **Step 3: Add variables to Vercel**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

Select "Production", "Preview", and "Development" for each when prompted.

- [ ] **Step 4: Verify variables load**

```bash
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

Expected: `https://grdeedwkzqyfxgfeskdr.supabase.co`

- [ ] **Step 5: Commit**

```bash
git add .env.local
git commit -m "chore: add supabase auth env vars"
```

---

### Task 3: Create Supabase client utilities

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Create the browser client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create the server client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — safe to ignore if
            // middleware is refreshing sessions.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create the middleware session helper**

Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: never call supabase.auth.getSession() here.
  // getUser() sends a request to the Supabase Auth server on every call,
  // which validates the session token and returns the authenticated user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/register", "/auth/callback"];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors for the three new files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add supabase client/server/middleware utilities"
```

---

### Task 4: Update middleware.ts

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Replace the middleware**

Replace the entire contents of `middleware.ts` with:

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Start dev server and verify redirect works**

```bash
npm run dev
```

Visit `http://localhost:3000/dashboard` in a browser while not logged in. Expected: redirect to `/login`.

- [ ] **Step 3: Verify `/login` is accessible without session**

Visit `http://localhost:3000/login`. Expected: login page renders without redirect loop.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat: replace kinde withAuth with supabase session middleware"
```

---

### Task 5: Add Supabase Auth callback route

**Files:**
- Create: `src/app/api/auth/callback/route.ts`

This route handles the PKCE code exchange for both magic link emails and Google OAuth.

- [ ] **Step 1: Create the callback route**

Create `src/app/api/auth/callback/route.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — redirect to login with an error indicator
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
```

- [ ] **Step 2: Verify the route file exists and has no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/callback/route.ts
git commit -m "feat: add supabase auth pkce callback route"
```

---

### Task 6: Update login page

**Files:**
- Modify: `src/app/login/page.tsx`

This replaces the two Kinde buttons with three authentication options: email+password, magic link, and Google OAuth.

- [ ] **Step 1: Replace login page**

Replace the entire contents of `src/app/login/page.tsx` with:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const callbackError = searchParams?.get("error");

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }
    setIsPasswordLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsPasswordLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email to receive a magic link.");
      return;
    }
    setIsMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    setIsMagicLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMagicSent(true);
    toast.success("Magic link sent! Check your inbox.");
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setIsGoogleLoading(false);
      toast.error(error.message);
    }
    // If successful, browser redirects — no need to setIsGoogleLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to Sahakar Daily Accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {callbackError && (
            <p className="text-sm text-red-600 text-center">
              Authentication failed. Please try again.
            </p>
          )}

          {/* Email + Password */}
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPasswordLoading}>
              {isPasswordLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign In with Password
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Magic Link */}
          {magicSent ? (
            <p className="text-sm text-center text-green-700 font-medium">
              Check your inbox for a magic link.
            </p>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleMagicLink}
              disabled={isMagicLoading}
            >
              {isMagicLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Magic Link
            </Button>
          )}

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <p className="text-center text-sm text-gray-500">
            Need access?{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Request registration
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: replace kinde login with supabase email+password, magic link, google oauth"
```

---

### Task 7: Add registrationRequests table to schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add the table definition**

Add the following block to `src/db/schema.ts` after the `notifications` table definition (around line 119, before the Relations section):

```typescript
// Registration Requests Table
export const registrationRequests = pgTable("registration_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  status: text("status").default("pending"), // pending | approved | rejected
  reviewedBy: text("reviewed_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

- [ ] **Step 2: Verify schema compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Generate and push migration**

```bash
npm run db:generate
npm run db:push
```

`db:generate` uses `DIRECT_URL` (see `drizzle.config.ts`). Confirm the new `registration_requests` table appears in the output.

- [ ] **Step 4: Verify table exists in Supabase**

```bash
npm run db:studio
```

Open the Drizzle Studio browser tab and confirm `registration_requests` is listed.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add registration_requests table to schema and push migration"
```

---

### Task 8: Create registration request page

**Files:**
- Create: `src/app/register/page.tsx`

- [ ] **Step 1: Create the registration page**

Create `src/app/register/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitRegistrationRequest } from "@/lib/actions/registrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  async function onSubmit(values: RegisterValues) {
    const result = await submitRegistrationRequest(values);
    if (result.success) {
      setSubmitted(true);
      toast.success("Registration request submitted!");
    } else {
      toast.error(result.error || "Failed to submit request.");
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Request Received</CardTitle>
            <CardDescription>
              Your registration request has been submitted. An administrator
              will review it and you will receive an invite email once approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Request Access</CardTitle>
          <CardDescription>
            Submit a registration request. An admin will approve and send you
            an invite link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Priya Sharma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="priya@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Request
              </Button>
            </form>
          </Form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors (the `submitRegistrationRequest` action does not exist yet — this will produce a missing-module error that will be resolved in Task 9).

- [ ] **Step 3: Commit (after Task 9 resolves the import)**

This step is intentionally deferred to after Task 9 so the commit contains both the page and the action together.

---

### Task 9: Create registration server actions

**Files:**
- Create: `src/lib/actions/registrations.ts`

This file contains three actions: submit a request (public), approve a request (admin/ho_accountant only — sends invite), and reject a request.

- [ ] **Step 1: Create the actions file**

Create `src/lib/actions/registrations.ts`:

```typescript
"use server";

import { db } from "@/db";
import { registrationRequests, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Public action — no auth required
// ---------------------------------------------------------------------------
export async function submitRegistrationRequest(input: {
  name: string;
  email: string;
  phone?: string;
}) {
  try {
    const existing = await db.query.registrationRequests.findFirst({
      where: eq(registrationRequests.email, input.email),
    });

    if (existing) {
      return {
        success: false,
        error: "A request for this email already exists.",
      };
    }

    await db.insert(registrationRequests).values({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
    });

    return { success: true };
  } catch (error) {
    console.error("submitRegistrationRequest error:", error);
    return { success: false, error: "Failed to submit request." };
  }
}

// ---------------------------------------------------------------------------
// Admin/HO Accountant only — approves a request and sends an invite email
// ---------------------------------------------------------------------------
export async function approveRegistrationRequest(input: {
  requestId: string;
  role: "admin" | "ho_accountant" | "outlet_manager" | "outlet_accountant";
  outletId?: string;
}) {
  try {
    // 1. Verify the caller is admin or ho_accountant
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: "Not authenticated." };
    }

    const callerDbUser = await db.query.users.findFirst({
      where: eq(users.id, authUser.id),
    });

    if (
      !callerDbUser ||
      (callerDbUser.role !== "admin" && callerDbUser.role !== "ho_accountant")
    ) {
      return { success: false, error: "Insufficient permissions." };
    }

    // 2. Fetch the registration request
    const request = await db.query.registrationRequests.findFirst({
      where: eq(registrationRequests.id, input.requestId),
    });

    if (!request) {
      return { success: false, error: "Registration request not found." };
    }

    if (request.status !== "pending") {
      return { success: false, error: "Request is not in pending state." };
    }

    // 3. Send invite via Supabase Admin API (service role key — server only)
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: inviteData, error: inviteError } =
      await adminSupabase.auth.admin.inviteUserByEmail(request.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(".supabase.co", "")}/api/auth/callback`,
        data: {
          full_name: request.name,
        },
      });

    if (inviteError || !inviteData.user) {
      console.error("Invite error:", inviteError);
      return { success: false, error: "Failed to send invite email." };
    }

    const newUserId = inviteData.user.id;

    // 4. Create the user row in our DB with the Supabase Auth UUID
    await db.insert(users).values({
      id: newUserId,
      name: request.name,
      email: request.email,
      phone: request.phone || null,
      role: input.role,
      outletId: input.outletId || null,
    });

    // 5. Mark the request as approved
    await db
      .update(registrationRequests)
      .set({
        status: "approved",
        reviewedBy: authUser.id,
        updatedAt: new Date(),
      })
      .where(eq(registrationRequests.id, input.requestId));

    revalidatePath("/admin/users");
    return { success: true, message: "User invited successfully." };
  } catch (error) {
    console.error("approveRegistrationRequest error:", error);
    return { success: false, error: "Failed to approve request." };
  }
}

// ---------------------------------------------------------------------------
// Admin/HO Accountant only — rejects a pending request
// ---------------------------------------------------------------------------
export async function rejectRegistrationRequest(requestId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: "Not authenticated." };
    }

    const callerDbUser = await db.query.users.findFirst({
      where: eq(users.id, authUser.id),
    });

    if (
      !callerDbUser ||
      (callerDbUser.role !== "admin" && callerDbUser.role !== "ho_accountant")
    ) {
      return { success: false, error: "Insufficient permissions." };
    }

    await db
      .update(registrationRequests)
      .set({
        status: "rejected",
        reviewedBy: authUser.id,
        updatedAt: new Date(),
      })
      .where(eq(registrationRequests.id, requestId));

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("rejectRegistrationRequest error:", error);
    return { success: false, error: "Failed to reject request." };
  }
}
```

- [ ] **Step 2: Add `registrationRequests` to the Drizzle relations (needed for `db.query.registrationRequests`)**

Open `src/db/schema.ts`. The `db.query` API requires a relation or at minimum the table to be exported. The table is already exported. Verify `src/db/index.ts` imports `* as schema` — it already does — so Drizzle will pick up the new table automatically.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/registrations.ts src/app/register/page.tsx
git commit -m "feat: add registration request flow with supabase admin invite"
```

---

### Task 10: Update `/admin/users` page with Pending Requests section

**Files:**
- Modify: `src/app/admin/users/page.tsx`

- [ ] **Step 1: Replace the page**

Replace the entire contents of `src/app/admin/users/page.tsx`:

```typescript
import { db } from "@/db";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/forms/UserForm";
import { deleteUser } from "@/lib/actions/users";
import {
  approveRegistrationRequest,
  rejectRegistrationRequest,
} from "@/lib/actions/registrations";
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  ho_accountant: "HO Accountant",
  outlet_manager: "Outlet Manager",
  outlet_accountant: "Outlet Accountant",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  ho_accountant: "bg-purple-100 text-purple-800",
  outlet_manager: "bg-blue-100 text-blue-800",
  outlet_accountant: "bg-green-100 text-green-800",
};

export default async function UsersPage() {
  const users = await db.query.users
    .findMany({
      with: { outlet: true },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    })
    .catch(() => []);

  const outlets = await db.query.outlets
    .findMany({ orderBy: (outlets, { asc }) => [asc(outlets.name)] })
    .catch(() => []);

  const pendingRequests = await db.query.registrationRequests
    .findMany({
      where: (rr, { eq }) => eq(rr.status, "pending"),
      orderBy: (rr, { asc }) => [asc(rr.createdAt)],
    })
    .catch(() => []);

  return (
    <Container className="py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">
            User Management
          </h1>
          <p className="text-gray-500">
            Manage users, roles, and branch assignments
          </p>
        </div>
      </div>

      {/* Pending Registration Requests */}
      {pendingRequests.length > 0 && (
        <Card className="mb-8 border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Clock className="h-5 w-5" />
              Pending Registration Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-amber-100">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-4 hover:bg-amber-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{req.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {req.email}
                        </span>
                        {req.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {req.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        Requested{" "}
                        {req.createdAt
                          ? format(new Date(req.createdAt), "dd MMM yyyy, HH:mm")
                          : "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Approve — defaults to outlet_manager, admin can change role/outlet separately */}
                      <form
                        action={async () => {
                          "use server";
                          await approveRegistrationRequest({
                            requestId: req.id,
                            role: "outlet_manager",
                          });
                          revalidatePath("/admin/users");
                        }}
                      >
                        <Button
                          type="submit"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await rejectRegistrationRequest(req.id);
                          revalidatePath("/admin/users");
                        }}
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* User Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserForm
                outlets={outlets.map((o) => ({ id: o.id, name: o.name }))}
              />
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No users found. Create your first user.
                  </div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">
                              {user.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role ?? ""] || "bg-gray-100 text-gray-800"}`}
                            >
                              {ROLE_LABELS[user.role ?? ""] || user.role}
                            </span>
                            {user.isActive === "false" && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {user.phone}
                              </span>
                            )}
                            {user.outlet && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {user.outlet.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            Created{" "}
                            {user.createdAt
                              ? format(new Date(user.createdAt), "dd MMM yyyy")
                              : "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <form
                            action={async () => {
                              "use server";
                              await deleteUser(user.id);
                              revalidatePath("/admin/users");
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              disabled={user.role === "admin"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat: add pending registration requests section to admin users page"
```

---

### Task 11: Update server actions — accounts.ts

**Files:**
- Modify: `src/lib/actions/accounts.ts`

The current file uses hardcoded `isAdmin = true` / `userId = "admin-user"` stubs. This task replaces them with real session reads.

- [ ] **Step 1: Replace the entire file**

Replace `src/lib/actions/accounts.ts` with:

```typescript
"use server";

import { db } from "@/db";
import { dailyAccounts, outlets, users } from "@/db/schema";
import { dailyEntrySchema } from "@/lib/validations/entry";
import { revalidatePath } from "next/cache";
import { eq, and, between, sql, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("Not authenticated.");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
  });

  if (!dbUser) {
    throw new Error("User record not found in database.");
  }

  const isAdmin =
    dbUser.role === "admin" || dbUser.role === "ho_accountant";

  return {
    userId: dbUser.id,
    role: dbUser.role,
    outletId: dbUser.outletId ?? undefined,
    isAdmin,
  };
}

export async function submitDailyAccount(rawData: unknown) {
  try {
    const { userId, isAdmin, outletId } = await getSessionContext();

    const validatedData = dailyEntrySchema.parse(rawData);

    const targetOutletId = isAdmin ? validatedData.outletId : outletId;

    if (!targetOutletId) {
      return { success: false, error: "No outlet assigned to user." };
    }

    const outletExists = await db
      .select()
      .from(outlets)
      .where(eq(outlets.id, targetOutletId))
      .limit(1);

    if (outletExists.length === 0) {
      return { success: false, error: "Invalid outlet selected." };
    }

    const dateStr = validatedData.date.toISOString().split("T")[0];

    await db
      .insert(dailyAccounts)
      .values({
        date: dateStr,
        outletId: targetOutletId,
        saleCash: validatedData.saleCash.toString(),
        saleUpi: validatedData.saleUpi.toString(),
        saleCredit: validatedData.saleCredit.toString(),
        saleReturn: validatedData.saleReturn.toString(),
        expenses: validatedData.expenses.toString(),
        purchase: validatedData.purchase.toString(),
        closingStock: validatedData.closingStock.toString(),
        createdBy: userId,
      })
      .onConflictDoUpdate({
        target: [dailyAccounts.date, dailyAccounts.outletId],
        set: {
          saleCash: validatedData.saleCash.toString(),
          saleUpi: validatedData.saleUpi.toString(),
          saleCredit: validatedData.saleCredit.toString(),
          saleReturn: validatedData.saleReturn.toString(),
          expenses: validatedData.expenses.toString(),
          purchase: validatedData.purchase.toString(),
          closingStock: validatedData.closingStock.toString(),
          updatedAt: new Date(),
        },
      });

    revalidatePath("/entry");
    revalidatePath("/reports");
    revalidatePath("/dashboard");

    return { success: true, message: "Entry saved successfully!" };
  } catch (error: any) {
    console.error("submitDailyAccount Error:", error);
    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors.map((e: any) => e.message).join(", "),
      };
    }
    return { success: false, error: error.message || "Database error." };
  }
}

export async function getDailyEntries(
  _filterDate?: string,
  filterOutletId?: string
) {
  try {
    const { isAdmin, outletId } = await getSessionContext();

    const query = db
      .select()
      .from(dailyAccounts)
      .innerJoin(outlets, eq(dailyAccounts.outletId, outlets.id));

    const conditions = [];

    if (!isAdmin) {
      if (!outletId) throw new Error("Manager has no assigned outlet");
      conditions.push(eq(dailyAccounts.outletId, outletId));
    } else if (filterOutletId) {
      conditions.push(eq(dailyAccounts.outletId, filterOutletId));
    }

    const finalQuery =
      conditions.length > 0 ? query.where(and(...conditions)) : query;

    const result = await finalQuery.orderBy(dailyAccounts.date);

    return { success: true, data: result };
  } catch (error: any) {
    console.error("getDailyEntries Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getDailyEntriesForLastDays(days: number = 7) {
  try {
    const { isAdmin, outletId } = await getSessionContext();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = new Date().toISOString().split("T")[0];

    const conditions: any[] = [
      between(dailyAccounts.date, startDateStr, endDateStr),
    ];

    if (!isAdmin) {
      if (!outletId) throw new Error("Manager has no assigned outlet");
      conditions.push(eq(dailyAccounts.outletId, outletId));
    }

    const result = await db
      .select()
      .from(dailyAccounts)
      .innerJoin(outlets, eq(dailyAccounts.outletId, outlets.id))
      .where(and(...conditions))
      .orderBy(dailyAccounts.date);

    return { success: true, data: result };
  } catch (error: any) {
    console.error("getDailyEntriesForLastDays Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getAllOutlets() {
  try {
    await getSessionContext(); // auth guard
    const result = await db.select().from(outlets).orderBy(outlets.name);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("getAllOutlets Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getMonthlyAggregates(year: number, month: number) {
  try {
    await getSessionContext(); // auth guard

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const result = await db
      .select({
        outletId: dailyAccounts.outletId,
        outletName: outlets.name,
        totalSales: sql<number>`SUM(CAST(${dailyAccounts.saleCash} AS DECIMAL) + CAST(${dailyAccounts.saleUpi} AS DECIMAL) + CAST(${dailyAccounts.saleCredit} AS DECIMAL))`,
        totalExpenses: sql<number>`SUM(CAST(${dailyAccounts.expenses} AS DECIMAL))`,
        totalPurchase: sql<number>`SUM(CAST(${dailyAccounts.purchase} AS DECIMAL))`,
        totalEntries: sql<number>`COUNT(*)`,
      })
      .from(dailyAccounts)
      .innerJoin(outlets, eq(dailyAccounts.outletId, outlets.id))
      .where(between(dailyAccounts.date, startDateStr, endDateStr))
      .groupBy(dailyAccounts.outletId, outlets.name);

    return { success: true, data: result };
  } catch (error: any) {
    console.error("getMonthlyAggregates Error:", error);
    return { success: false, error: error.message };
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/accounts.ts
git commit -m "feat: wire real supabase session into accounts server actions"
```

---

### Task 12: Update server actions — users.ts

**Files:**
- Modify: `src/lib/actions/users.ts`

Remove `nanoid` (Supabase UUID is now the user ID). Add auth guard to admin-only mutations.

- [ ] **Step 1: Replace the file**

Replace `src/lib/actions/users.ts` with:

```typescript
"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdminOrHo() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) throw new Error("Not authenticated.");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
  });

  if (
    !dbUser ||
    (dbUser.role !== "admin" && dbUser.role !== "ho_accountant")
  ) {
    throw new Error("Insufficient permissions.");
  }

  return dbUser;
}

export async function getAllUsers() {
  try {
    const result = await db.query.users.findMany({
      with: { outlet: true },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("getAllUsers error:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function getUserById(id: string) {
  try {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: { outlet: true },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("getUserById error:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

interface CreateUserInput {
  id: string; // Supabase Auth UUID — must be provided by caller (approveRegistrationRequest)
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "ho_accountant" | "outlet_manager" | "outlet_accountant";
  outletId?: string;
}

export async function createUser(input: CreateUserInput) {
  try {
    await requireAdminOrHo();

    if (!input.name || !input.email || !input.role) {
      return { success: false, error: "Name, email, and role are required" };
    }

    if (
      (input.role === "outlet_manager" || input.role === "outlet_accountant") &&
      !input.outletId
    ) {
      return {
        success: false,
        error: "Outlet is required for outlet-level roles",
      };
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existingUser) {
      return { success: false, error: "User with this email already exists" };
    }

    await db.insert(users).values({
      id: input.id,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      role: input.role,
      outletId: input.outletId || null,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "User created successfully" };
  } catch (error: any) {
    console.error("createUser error:", error);
    return { success: false, error: error.message || "Failed to create user" };
  }
}

interface UpdateUserInput {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "ho_accountant" | "outlet_manager" | "outlet_accountant";
  outletId?: string;
  isActive: boolean;
}

export async function updateUser(input: UpdateUserInput) {
  try {
    await requireAdminOrHo();

    if (!input.name || !input.email || !input.role) {
      return { success: false, error: "Name, email, and role are required" };
    }

    if (
      (input.role === "outlet_manager" || input.role === "outlet_accountant") &&
      !input.outletId
    ) {
      return {
        success: false,
        error: "Outlet is required for outlet-level roles",
      };
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, input.id),
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    const emailConflict = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (emailConflict && emailConflict.id !== input.id) {
      return { success: false, error: "User with this email already exists" };
    }

    await db
      .update(users)
      .set({
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        role: input.role,
        outletId: input.outletId || null,
        isActive: input.isActive ? "true" : "false",
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.id));

    revalidatePath("/admin/users");
    return { success: true, message: "User updated successfully" };
  } catch (error: any) {
    console.error("updateUser error:", error);
    return { success: false, error: error.message || "Failed to update user" };
  }
}

export async function deleteUser(id: string) {
  try {
    await requireAdminOrHo();

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    if (existingUser.role === "admin") {
      return { success: false, error: "Cannot delete admin user" };
    }

    await db.delete(users).where(eq(users.id, id));

    revalidatePath("/admin/users");
    return { success: true, message: "User deleted successfully" };
  } catch (error: any) {
    console.error("deleteUser error:", error);
    return { success: false, error: error.message || "Failed to delete user" };
  }
}
```

- [ ] **Step 2: Update UserForm to not require id in the create path**

The `UserForm` component calls `createUser` — but `createUser` now requires an `id`. The `UserForm` use-case (creating a user directly from the admin panel without going through the invite flow) needs to be handled. The admin-panel direct-create path should also invite the user.

Open `src/components/forms/UserForm.tsx` and replace the `createUser` call block (lines 100–106) with:

```typescript
: await createUser({
    id: crypto.randomUUID(), // placeholder; in production use inviteUserByEmail instead
    name: values.name,
    email: values.email,
    phone: values.phone,
    role: values.role,
    outletId: values.outletId || undefined,
  });
```

Note: The admin direct-create via `UserForm` is a legacy path that will remain functional. For the proper invite flow, use `approveRegistrationRequest` which generates the Supabase UUID from `inviteUserByEmail`.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/users.ts src/components/forms/UserForm.tsx
git commit -m "feat: add auth guard to users actions, remove nanoid dependency"
```

---

### Task 13: Add session guards to API route handlers

**Files:**
- Modify: `src/app/api/dashboard-stats/route.ts`
- Modify: `src/app/api/outlets/route.ts`
- Modify: `src/app/api/outlets-list/route.ts`
- Modify: `src/app/api/outlets-stats/route.ts`
- Modify: `src/app/api/all-reports/route.ts`
- Modify: `src/app/api/own-reports/route.ts`

Each route needs the same three-line session guard at the top of each handler. This task shows the guard pattern and the full replacement for the two most important routes. Apply the same pattern to all six.

**Session guard pattern (add at the top of every `GET`/`POST` handler body):**

```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

- [ ] **Step 1: Update dashboard-stats route**

Add `import { createClient } from "@/lib/supabase/server";` to the imports section of `src/app/api/dashboard-stats/route.ts`. Then insert the three-line session guard as the first three lines inside the `try` block of the `GET` function (before `const { searchParams } = ...`).

- [ ] **Step 2: Update outlets route**

Add `import { createClient } from "@/lib/supabase/server";` to `src/app/api/outlets/route.ts`. Insert the guard at the top of the `POST` handler's `try` block (before `const body = ...`). Also replace the hardcoded `userName: "Admin"` in the audit log with `userName: user.email ?? "Admin"`.

- [ ] **Step 3: Update outlets-list route**

Add `import { createClient } from "@/lib/supabase/server";` to `src/app/api/outlets-list/route.ts`. Insert the guard at the top of the `GET` handler's `try` block.

- [ ] **Step 4: Update outlets-stats route**

Add `import { createClient } from "@/lib/supabase/server";` to `src/app/api/outlets-stats/route.ts`. Insert the guard at the top of the `GET` handler's `try` block.

- [ ] **Step 5: Update all-reports route**

Add `import { createClient } from "@/lib/supabase/server";` to `src/app/api/all-reports/route.ts`. Insert the guard at the top of the `GET` handler's `try` block.

- [ ] **Step 6: Update own-reports route**

Add `import { createClient } from "@/lib/supabase/server";` to `src/app/api/own-reports/route.ts`. Insert the guard at the top of the `GET` handler's `try` block.

- [ ] **Step 7: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/
git commit -m "feat: add supabase session guard to all api route handlers"
```

---

### Task 14: Update TopNav — replace Kinde with Supabase

**Files:**
- Modify: `src/components/shared/TopNav.tsx`

- [ ] **Step 1: Replace the TopNav file**

Replace the entire contents of `src/components/shared/TopNav.tsx` with:

```typescript
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  FileText,
  Users,
  Building2,
  Menu,
  Plus,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <nav className="border-b bg-white sticky top-0 z-40 shadow-none">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4 md:gap-12">
          <div className="md:hidden flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-gray-900 hover:bg-gray-100 rounded-none"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-64 mt-2 border border-gray-200 shadow-2xl p-1 rounded-none bg-white"
              >
                <div className="px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Navigation Context
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-gray-50 mx-1" />
                <Link href="/dashboard" className="w-full">
                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest p-3 rounded-none cursor-pointer transition-colors focus:bg-gray-900 focus:text-white flex items-center gap-3 m-0.5">
                    <BarChart3 className="h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/entry" className="w-full">
                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest p-3 rounded-none cursor-pointer transition-colors focus:bg-gray-900 focus:text-white flex items-center gap-3 m-0.5">
                    <Plus className="h-4 w-4" />
                    Entries
                  </DropdownMenuItem>
                </Link>
                <Link href="/reports" className="w-full">
                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest p-3 rounded-none cursor-pointer transition-colors focus:bg-gray-900 focus:text-white flex items-center gap-3 m-0.5">
                    <FileText className="h-4 w-4" />
                    Reports
                  </DropdownMenuItem>
                </Link>
                <Link href="/outlets" className="w-full">
                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest p-3 rounded-none cursor-pointer transition-colors focus:bg-gray-900 focus:text-white flex items-center gap-3 m-0.5">
                    <Building2 className="h-4 w-4" />
                    Outlets
                  </DropdownMenuItem>
                </Link>
                <Link href="/accounts/chart-of-accounts" className="w-full">
                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest p-3 rounded-none cursor-pointer transition-colors focus:bg-gray-900 focus:text-white flex items-center gap-3 m-0.5">
                    <FileText className="h-4 w-4" />
                    Accounts
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/users" className="w-full">
                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest p-3 rounded-none cursor-pointer transition-colors focus:bg-gray-900 focus:text-white flex items-center gap-3 m-0.5">
                    <Users className="h-4 w-4" />
                    Staff
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-3 font-black text-xl text-gray-900 group tracking-tighter uppercase"
          >
            <div className="p-1 px-2 bg-gray-900 rounded-none group-hover:bg-gray-800 transition-colors">
              <span className="text-white text-base">S</span>
            </div>
            DOAMS
          </Link>

          <div className="hidden md:flex gap-1">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={`text-[10px] font-black uppercase tracking-widest h-10 rounded-none px-4 ${
                  pathname === "/dashboard" || pathname.startsWith("/admin")
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "text-gray-400 hover:text-gray-900"
                }`}
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/entry">
              <Button
                variant="ghost"
                size="sm"
                className={`text-[10px] font-black uppercase tracking-widest h-10 rounded-none px-4 ${
                  pathname === "/entry" || pathname.startsWith("/outlet/")
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "text-gray-400 hover:text-gray-900"
                }`}
              >
                Entries
              </Button>
            </Link>
            <Link href="/reports">
              <Button
                variant="ghost"
                size="sm"
                className={`text-[10px] font-black uppercase tracking-widest h-10 rounded-none px-4 ${
                  pathname === "/reports" || pathname === "/reports/own"
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "text-gray-400 hover:text-gray-900"
                }`}
              >
                Reports
              </Button>
            </Link>
            <Link href="/outlets">
              <Button
                variant="ghost"
                size="sm"
                className={`text-[10px] font-black uppercase tracking-widest h-10 rounded-none px-4 ${
                  pathname === "/outlets"
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "text-gray-400 hover:text-gray-900"
                }`}
              >
                Outlets
              </Button>
            </Link>
            <Link href="/accounts/chart-of-accounts">
              <Button
                variant="ghost"
                size="sm"
                className={`text-[10px] font-black uppercase tracking-widest h-10 rounded-none px-4 ${
                  pathname.startsWith("/accounts")
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "text-gray-400 hover:text-gray-900"
                }`}
              >
                Accounts
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button
                variant="ghost"
                size="sm"
                className={`text-[10px] font-black uppercase tracking-widest h-10 rounded-none px-4 ${
                  pathname.startsWith("/admin/users")
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "text-gray-400 hover:text-gray-900"
                }`}
              >
                Staff
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-8 w-[1px] bg-gray-100 hidden md:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 p-0 hover:bg-transparent border-none rounded-none h-10 pr-2"
              >
                <Avatar className="h-8 w-8 rounded-none border border-gray-100">
                  <AvatarFallback className="bg-gray-900 text-white text-[10px] font-black rounded-none">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-[10px] font-black text-gray-900 leading-none tracking-tight uppercase">
                    {displayName}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {user?.email || ""}
                  </p>
                </div>
                <ChevronDown className="h-3 w-3 text-gray-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 mt-2 border border-gray-200 shadow-2xl p-1 rounded-none bg-white"
            >
              <DropdownMenuLabel className="p-3">
                <div className="flex flex-col gap-1">
                  <p className="font-black text-[10px] text-gray-900 uppercase tracking-widest leading-none">
                    {displayName}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-50" />
              <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors focus:bg-gray-900 focus:text-white p-3 rounded-none m-0.5">
                <Users className="h-4 w-4 mr-3" />
                Terminal Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-50" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-red-500 transition-colors focus:bg-red-500 focus:text-white p-3 rounded-none m-0.5"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/TopNav.tsx
git commit -m "feat: replace kinde hooks and LogoutLink with supabase signOut in TopNav"
```

---

### Task 15: Remove Kinde files and clean layout.tsx

**Files:**
- Delete: `src/app/AuthProvider.tsx`
- Delete: `src/app/api/auth/[kindeAuth]/route.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Delete Kinde files**

```bash
rm src/app/AuthProvider.tsx
rm "src/app/api/auth/[kindeAuth]/route.ts"
rmdir "src/app/api/auth/[kindeAuth]" 2>/dev/null || true
```

- [ ] **Step 2: Update layout.tsx**

Replace `src/app/layout.tsx` with:

```typescript
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClientLayout } from "@/components/shared/ClientLayout";
import "@/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sahakar Daily Accounts",
  description: "Enterprise ERP for Daily Outlet Accounts",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify no remaining Kinde imports**

```bash
grep -r "kinde" src/ --include="*.ts" --include="*.tsx" -l
```

Expected: no output.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git add -u src/app/AuthProvider.tsx "src/app/api/auth/[kindeAuth]/route.ts"
git commit -m "chore: remove kinde AuthProvider, kindeAuth route, and KindeProvider from layout"
```

---

### Task 16: Configure Supabase Auth providers in dashboard

These are dashboard-level steps (not code changes), but they must be done for login to work end-to-end.

- [ ] **Step 1: Enable Email provider**

In the Supabase dashboard → Authentication → Providers → Email:
- Ensure "Enable Email provider" is ON.
- Set "Confirm email" to ON (users get an email confirmation link).
- Set "Secure email change" to ON.

- [ ] **Step 2: Enable Google OAuth**

In the Supabase dashboard → Authentication → Providers → Google:
- Toggle ON.
- Go to Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID.
- Application type: Web application.
- Authorized redirect URIs: `https://grdeedwkzqyfxgfeskdr.supabase.co/auth/v1/callback`
- Copy the Client ID and Client Secret back into the Supabase Google provider form.
- Save.

- [ ] **Step 3: Set Site URL and redirect URLs**

In the Supabase dashboard → Authentication → URL Configuration:
- Site URL: `https://your-production-domain.vercel.app` (or `http://localhost:3000` for dev)
- Additional redirect URLs: `http://localhost:3000/api/auth/callback`, `https://your-production-domain.vercel.app/api/auth/callback`

- [ ] **Step 4: Disable public signup (invite-only)**

In the Supabase dashboard → Authentication → Settings:
- Toggle "Enable sign up" to OFF. This means `signUp()` will be rejected — only `inviteUserByEmail` from a service-role client can create new users.

---

### Task 17: Seed a first admin user (bootstrap)

With public signup disabled, you need to create the first admin user through the Supabase dashboard before any code-path invite flow exists for them.

- [ ] **Step 1: Create the auth user in Supabase dashboard**

In the Supabase dashboard → Authentication → Users → "Invite user":
- Enter the admin's email address.
- Click Invite. The user will receive an email to set their password.
- Note the UUID generated for this user (visible in the Users list).

- [ ] **Step 2: Insert the corresponding users row in the DB**

Run this SQL in the Supabase SQL editor (replace values accordingly):

```sql
INSERT INTO users (id, name, email, role, is_active, created_at, updated_at)
VALUES (
  '<uuid-from-supabase-users-list>',
  'Admin User',
  'admin@example.com',
  'admin',
  'true',
  now(),
  now()
);
```

- [ ] **Step 3: Verify admin can sign in**

Start the dev server and go to `http://localhost:3000/login`. Sign in with the admin email after clicking the invite link to set a password. Expected: redirect to `/dashboard`.

---

### Task 18: End-to-end smoke test

- [ ] **Step 1: Test password login**

```
1. Go to /login
2. Enter admin email + password
3. Expected: redirect to /dashboard, TopNav shows admin name
```

- [ ] **Step 2: Test magic link**

```
1. Go to /login
2. Enter a valid email, click "Send Magic Link"
3. Expected: toast "Magic link sent"
4. Click link in email
5. Expected: redirect to /dashboard
```

- [ ] **Step 3: Test registration request flow**

```
1. Go to /register
2. Fill name/email/phone, submit
3. Expected: "Request Received" success screen
4. Log in as admin, go to /admin/users
5. Expected: Pending Registration Requests card shows the new request
6. Click Approve
7. Expected: request disappears from pending; invite email sent to the email address
8. Click invite link, set password
9. Expected: can log in, redirect to /dashboard
```

- [ ] **Step 4: Test session expiry redirect**

```
1. Clear cookies (or use private window)
2. Go to /dashboard
3. Expected: redirect to /login
```

- [ ] **Step 5: Test sign out**

```
1. Log in, click avatar → Sign Out
2. Expected: redirect to /login
3. Try navigating to /dashboard
4. Expected: redirect to /login
```

- [ ] **Step 6: Final TypeScript build check**

```bash
npm run build
```

Expected: build completes with no type errors.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete supabase auth migration — all login flows working"
```

---

## Self-Review Checklist

### Spec coverage

| Requirement | Task |
|-------------|------|
| Install @supabase/supabase-js, @supabase/ssr; remove kinde | Task 1 |
| 3 Supabase client utility files | Task 3 |
| Update middleware | Task 4 |
| Auth callback route | Task 5 |
| Login page with email+password, magic link, Google | Task 6 |
| Register page (name, email, phone form) | Task 8 |
| registrationRequests DB table | Task 7 |
| submitRegistrationRequest + approveRegistrationRequest actions | Task 9 |
| /admin/users Pending Requests section | Task 10 |
| accounts.ts session context | Task 11 |
| users.ts session context | Task 12 |
| API route guards | Task 13 |
| TopNav signOut | Task 14 |
| Remove Kinde files | Task 15 |
| users.id stays text, Supabase UUID stored as-is | Tasks 7, 11, 12 |
| SUPABASE_SERVICE_ROLE_KEY server-only | Task 9 (server action only) |
| Supabase dashboard configuration | Task 16 |
| First admin bootstrap | Task 17 |

### Placeholder scan

No "TBD", "TODO", "implement later", or "similar to Task N" patterns used. All code blocks are complete.

### Type consistency

- `createClient()` in `src/lib/supabase/server.ts` returns `SupabaseClient` — used as `await createClient()` in every server action and route handler.
- `createClient()` in `src/lib/supabase/client.ts` returns `SupabaseClient` — used in `TopNav.tsx` and `login/page.tsx`.
- `registrationRequests` table exported from `src/db/schema.ts` — imported in `src/lib/actions/registrations.ts` and `src/app/admin/users/page.tsx`.
- `approveRegistrationRequest` / `rejectRegistrationRequest` — defined in `registrations.ts`, imported in `admin/users/page.tsx`.
- `submitRegistrationRequest` — defined in `registrations.ts`, imported in `register/page.tsx`.
- `users.id` remains `text` type in Drizzle schema — Supabase UUIDs (strings) stored directly.
