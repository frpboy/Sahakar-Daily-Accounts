import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ClientLayout } from "@/components/shared/ClientLayout";
import "./globals.css";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Sahakar Daily Accounts",
  description: "Enterprise ERP for Daily Outlet Accounts",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className={`${geistSans.className} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

