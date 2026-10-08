import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { UI } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { default: UI.bn.metaTitle, template: "%s — AI Engineering" },
  description: UI.bn.metaDescription,
};

/** Bangla pages: the same site under /bn. */
export default function BanglaLayout({ children }: { children: ReactNode }) {
  return <SiteShell lang="bn">{children}</SiteShell>;
}
