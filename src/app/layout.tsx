import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a', // slate-900
};

const appUrl = process.env.NEXT_PUBLIC_URL || "https://pro.itscashless.com";

export const metadata: Metadata = {
  title: "Zabal-Tip $BOOSTR",
  description: "Farcaster Mini App for $BOOSTR tipping",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/splash-new.png`,
      button: {
        title: "Open Tracker",
        action: {
          type: "launch_frame",
          name: "BOOSTR",
          url: appUrl,
          splashImageUrl: `${appUrl}/splash-new.png`,
          splashBackgroundColor: "#0f172a",
        },
      },
    }),
  },
};

import { Providers } from "./providers/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-900 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
