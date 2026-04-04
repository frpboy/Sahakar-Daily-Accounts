import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ClientLayout } from "@/components/shared/ClientLayout";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import "./globals.css";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Sahakar Daily Accounts",
  description: "Enterprise ERP for Daily Outlet Accounts",
  manifest: "/manifest.json",
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
      <GoogleAnalytics gaId="G-PS3S7ERL8E" />
      <Script
        id="clarity-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","w6c8xi19wi");`,
        }}
      />
    </html>
  );
}

