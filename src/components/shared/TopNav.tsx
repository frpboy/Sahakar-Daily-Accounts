"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Users, Building2 } from "lucide-react";
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

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/admin/overview"
            className="flex items-center gap-2 font-semibold text-lg"
          >
            <BarChart3 className="h-6 w-6" />
            DOAMS
          </Link>

          <div className="hidden md:flex gap-2">
            <Link href="/admin/overview">
              <Button
                variant={
                  pathname === "/admin/overview" || pathname === "/dashboard"
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
                  pathname === "/entry" || pathname.startsWith("/outlet")
                    ? "default"
                    : "ghost"
                }
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </Link>

            <Link href="/reports">
              <Button
                variant={
                  pathname === "/reports" || pathname === "/reports/own"
                    ? "default"
                    : "ghost"
                }
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </Link>

            <Link href="/outlets">
              <Button
                variant={pathname === "/outlets" ? "default" : "ghost"}
                size="sm"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Outlets
              </Button>
            </Link>

            <Link href="/accounts/chart-of-accounts">
              <Button
                variant={pathname.startsWith("/accounts") ? "default" : "ghost"}
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Accounts
              </Button>
            </Link>

            <Link href="/admin/users">
              <Button
                variant={pathname === "/admin/users" ? "default" : "ghost"}
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                    RA
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">Rahul</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">Rahul</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm">
                <Users className="h-4 w-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
