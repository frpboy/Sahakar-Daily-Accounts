"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  FileText,
  Users,
  Building2,
  Menu,
  Plus,
  ChevronDown,
  LogOut,
  Settings,
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

export function TopNav() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? null);
        const meta = data.user.user_metadata as Record<string, string> | undefined;
        setUserName(meta?.full_name ?? meta?.name ?? null);

        // Fetch role from users table
        const { data: dbUser } = await supabase
          .from("users")
          .select("name, role")
          .eq("id", data.user.id)
          .single();

        if (dbUser) {
          if (dbUser.name) setUserName(dbUser.name);
          setUserRole(dbUser.role);
        }
      }
    });
  }, []);

  const formatRole = (role: string | null) => {
    if (!role) return "User";
    if (role === "admin") return "admin";
    if (role === "ho_accountant") return "HO Accountant";
    return role
      .split("_")
      .map((word) => 
        word === "ho" ? "HO" : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

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
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

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
                {/* 
                <Link href="/accounts/chart-of-accounts" className="w-full">
                  <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest p-3 rounded-none cursor-pointer transition-colors focus:bg-gray-900 focus:text-white flex items-center gap-3 m-0.5">
                    <FileText className="h-4 w-4" />
                    Accounts
                  </DropdownMenuItem>
                </Link> 
                */}
                {(userRole === "admin" || userRole === "ho_accountant") && (
                  <Link href="/admin/users" className="w-full">
                    <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest p-3 rounded-none cursor-pointer transition-colors focus:bg-gray-900 focus:text-white flex items-center gap-3 m-0.5">
                      <Users className="h-4 w-4" />
                      Staff
                    </DropdownMenuItem>
                  </Link>
                )}
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
                  pathname === "/dashboard" || pathname === "/"
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

            {/* 
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
            */}

            {(userRole === "admin" || userRole === "ho_accountant") && (
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
            )}
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
                    {getInitials(userName || userEmail)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-[10px] font-black text-gray-900 leading-none tracking-tight uppercase">
                    {userRole ? `${formatRole(userRole)} - ` : ""}{userName || "User"}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {userEmail || ""}
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
                    {userRole ? `${formatRole(userRole)} - ` : ""}{userName || "User"}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                    {userEmail || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-50" />
              <Link href="/admin/settings">
                <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors focus:bg-gray-900 focus:text-white p-3 rounded-none m-0.5">
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </DropdownMenuItem>
              </Link>
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
