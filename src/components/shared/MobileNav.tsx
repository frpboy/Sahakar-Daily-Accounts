"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, LayoutGrid, Activity, Building2 } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: BarChart3, label: "Stats" },
    { href: "/entry", icon: FileText, label: "Entry" },
    { href: "/outlets", icon: Building2, label: "Outlets" },
    { href: "/admin/audit-logs", icon: Activity, label: "Audit" },
    { href: "/accounts/chart-of-accounts", icon: LayoutGrid, label: "Accounts" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 px-2 py-1.5 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 min-w-[64px] transition-all relative py-1 ${
                isActive ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                isActive ? "bg-blue-50 scale-110" : "group-hover:bg-gray-50"
              }`}>
                <Icon className={`h-5 w-5 ${isActive ? "text-blue-600 stroke-[2.5px]" : "text-gray-400 stroke-[1.8px]"}`} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                isActive ? "opacity-100" : "opacity-70"
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
