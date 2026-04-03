"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { TopNav } from "./TopNav";

export function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = pathname === "/login" || pathname === "/register";

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {!isPublicPage && <TopNav />}
      <main className="flex-1">{children}</main>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
