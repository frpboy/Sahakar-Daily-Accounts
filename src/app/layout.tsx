import type { Metadata } from "next";
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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
