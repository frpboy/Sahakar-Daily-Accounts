"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { TopNav } from "./TopNav";
import { PWAHandler } from "./PWAHandler";
import { MobileNav } from "./MobileNav";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50/50 flex flex-col">
        <PWAHandler />
        <TopNav />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}
