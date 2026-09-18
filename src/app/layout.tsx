import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";

import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "إدارة الحضانة",
    template: "%s | إدارة الحضانة",
  },
  description:
    "منصّة لإدارة الأطفال والفصول والحضور والإعلانات في الحضانة.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  // Matches --primary in globals.css / theme_color in manifest.ts.
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
