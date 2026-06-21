export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { getSettings } from "@/lib/settings";
import "./globals.css";

/** "#ff2d6d" → "255 45 109" (space-separated channels for rgb()). Falls back
 *  to the brand magenta if the stored value isn't a valid 6-digit hex. */
function hexToRgbChannels(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return "255 45 109";
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Libs3d — small 3D-printed things, made by a kid",
  description:
    "A little 3D-print shop run by a kid. Every order gets a grown-up's yes before anything is made.",
  icons: { icon: "/logo-mark.svg" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const accentChannels = hexToRgbChannels(settings.accentColor);
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable}`}
      style={{ "--accent-rgb": accentChannels } as React.CSSProperties}
    >
      <body className="min-h-dvh">
        {/* Pinned chrome lives OUTSIDE the smoother (it transforms its content,
            which would break position: fixed/sticky). */}
        <ScrollProgress />
        <Suspense fallback={null}>
          <TopNav />
        </Suspense>
        <SmoothScroll>
          <main className="flex-1 pt-20">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
