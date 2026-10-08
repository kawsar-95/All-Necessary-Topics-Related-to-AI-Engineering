import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";

/** English pages: the site at its normal URLs. */
export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <SiteShell lang="en">{children}</SiteShell>;
}
