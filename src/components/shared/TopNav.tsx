"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  isAdmin?: boolean;
}

export function TopNav({ isAdmin = true }: TopNavProps) {
  const pathname = usePathname();

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
                variant={
                  pathname.startsWith("/dashboard") ||
                  pathname.startsWith("/admin/overview")
                    ? "default"
                    : "ghost"
                }
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>

            <Link href="/entry">
              <Button
                variant={
                  pathname.startsWith("/entry") ||
                  pathname.startsWith("/outlet")
                    ? "default"
                    : "ghost"
                }
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </Link>

            {isAdmin && (
              <>
                <Link href="/accounts/chart-of-accounts">
                  <Button
                    variant={
                      pathname.startsWith("/accounts") ? "default" : "ghost"
                    }
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Accounts
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button
                    variant={
                      pathname.startsWith("/admin/users") ? "default" : "ghost"
                    }
                    size="sm"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link href="/entry">
            <Button variant="ghost" size="sm">
              New Entry
            </Button>
          </Link>
          {isAdmin && (
            <>
              <Link href="/accounts/chart-of-accounts">
                <Button variant="ghost" size="sm">
                  Accounts
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4 mr-1" />
                  Users
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
