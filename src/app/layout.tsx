import type { Metadata } from "next";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { auth } from "@/lib/auth";
import { ClientLayout } from "@/components/shared/ClientLayout";
import "@/globals.css";

export const metadata: Metadata = {
  title: "Sahakar Daily Accounts",
  description: "Enterprise ERP for Daily Outlet Accounts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <NeonAuthUIProvider 
          authClient={auth}
          viewPaths={{
            SIGN_IN: "/auth/sign-in",
            SIGN_UP: "/auth/sign-up",
            FORGOT_PASSWORD: "/auth/forgot-password",
            RESET_PASSWORD: "/auth/reset-password",
            RECOVER_ACCOUNT: "/auth/recover-account",
            CALLBACK: "/auth/callback",
          }}
        >
          <ClientLayout>{children}</ClientLayout>
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
