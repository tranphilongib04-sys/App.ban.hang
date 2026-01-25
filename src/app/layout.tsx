import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { AutoSyncListener } from "@/components/layout/auto-sync-listener";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Tiệm Bản Quyền - Quản lý Subscription",
  description: "Hệ thống quản lý bán tài khoản số - Tiệm Bản Quyền",
  icons: {
    icon: '/icon.png',
    apple: '/icon-256.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
          <AutoSyncListener />
          <Sidebar />
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
