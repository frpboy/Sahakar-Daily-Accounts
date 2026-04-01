"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
