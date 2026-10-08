import { Suspense } from "react";
import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { getNavItems } from "@/lib/topics";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SearchPalette } from "@/components/navigation/SearchPalette";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarList } from "@/components/layout/SidebarList";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-jb",
  subsets: ["latin"],
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Engineering — All Necessary Topics",
    template: "%s — AI Engineering",
  },
  description:
    "Thirteen reference parts covering every topic an applied AI engineer needs, from LLM fundamentals and prompt engineering to agents, inference, evaluation, safety, and AI application architecture. Each topic in three voices: technical, layman, and বাংলা.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const items = getNavItems();

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${notoBengali.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-text">
        <SiteHeader items={items} searchSlot={<SearchPalette />} />
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden border-r border-border lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-3.5rem)] lg:self-start lg:overflow-y-auto">
            <Suspense fallback={<SidebarList items={items} activeSlug={null} />}>
              <Sidebar items={items} />
            </Suspense>
          </aside>
          <div className="flex min-h-[calc(100vh-3.5rem)] min-w-0 flex-col">
            <main className="flex-1">{children}</main>
            <footer className="mt-24 border-t border-border px-6 py-8 text-xs leading-relaxed text-text-faint">
              <p className="mx-auto max-w-3xl">
                13 parts · citations verified against each publisher&apos;s
                metadata.
              </p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
