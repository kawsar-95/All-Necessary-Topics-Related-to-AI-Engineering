import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

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
    "Five reference guides covering every topic an applied AI engineer needs: LLM fundamentals, prompt engineering, context engineering, RAG & knowledge systems, and agentic systems. Each topic in three voices: technical, layman, and বাংলা.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${notoBengali.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border mt-24 py-8 text-center text-xs text-text-faint">
          Built as a Next.js port of the single-file AI Engineering reference
          guides. Citations verified against each publisher&apos;s metadata.
        </footer>
      </body>
    </html>
  );
}
