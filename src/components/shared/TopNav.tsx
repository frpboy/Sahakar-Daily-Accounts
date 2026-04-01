"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/auth";
import { BarChart3, FileText, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  isAdmin?: boolean;
}

export function TopNav({ isAdmin = false }: TopNavProps) {
  const pathname = usePathname();
  const { data: sessionData } = auth.useSession();
  const user = sessionData?.user;
  const signOut = () => auth.signOut();

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg"
          >
            <BarChart3 className="h-6 w-6" />
            DOAMS
          </Link>

          <div className="hidden md:flex gap-2">
            <Link href="/dashboard">
              <Button
                variant={pathname.startsWith("/dashboard") || pathname.startsWith("/outlet") || pathname.startsWith("/admin") ? "default" : "ghost"}
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>

            {isAdmin && (
              <Link href="/accounts/chart-of-accounts">
                <Button
                  variant={pathname.startsWith("/accounts") ? "default" : "ghost"}
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Accounts
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/auth/account">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.email}</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
