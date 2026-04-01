import type { Metadata } from "next";
import { ClientLayout } from "@/components/shared/ClientLayout";
import "@/globals.css";

export const metadata: Metadata = {
  title: "Sahakar Daily Accounts",
  description: "Enterprise ERP for Daily Outlet Accounts",
  manifest: "/manifest.json",
  themeColor: "#111827",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
