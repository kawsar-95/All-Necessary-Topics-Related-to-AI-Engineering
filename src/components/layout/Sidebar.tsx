"use client";

import { usePathname } from "next/navigation";
import { SidebarList, activeSlugFromPath, type NavItem } from "./SidebarList";
import type { Lang } from "@/lib/i18n";

/**
 * The desktop sidebar. It reads the pathname to mark the current Part.
 * usePathname can suspend on a path that is not known at build time, so
 * the layout wraps this component in Suspense.
 */
export function Sidebar({ items, lang }: { items: NavItem[]; lang: Lang }) {
  const pathname = usePathname();
  return <SidebarList items={items} lang={lang} activeSlug={activeSlugFromPath(pathname)} />;
}
