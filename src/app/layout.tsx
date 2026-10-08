import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { langInitScript } from "@/lib/i18n";
import { ServiceWorker } from "@/components/layout/ServiceWorker";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const fraunces = Fraunces({
  variable: "--font-fraunces",
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
  variable: "--font-noto-bengali",
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
  appleWebApp: {
    capable: true,
    title: "AI Engineering",
    statusBarStyle: "default",
  },
};

// The browser colors its title bar to match the page background (globals.css).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1013" },
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline scripts change data-theme and lang before React hydrates,
    // so React must accept the DOM values (suppressHydrationWarning). The
    // header, sidebar, and footer come from SiteShell in each language layout.
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${notoBengali.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: langInitScript(BASE_PATH) }} />
      </head>
      <body className="min-h-full bg-bg text-text">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
