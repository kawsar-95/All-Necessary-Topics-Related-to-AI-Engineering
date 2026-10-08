"use client";

import { usePathname } from "next/navigation";
import { SidebarList, activeSlugFromPath, type NavItem } from "./SidebarList";

/**
 * The desktop sidebar. It reads the pathname to mark the current Part.
 * usePathname can suspend on a path that is not known at build time, so
 * the layout wraps this component in Suspense.
 */
export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return <SidebarList items={items} activeSlug={activeSlugFromPath(pathname)} />;
}
