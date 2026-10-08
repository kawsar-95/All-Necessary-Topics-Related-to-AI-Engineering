import { Suspense } from "react";
import type { ReactNode } from "react";
import { getNavItems } from "@/lib/topics";
import { UI } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { SiteHeader } from "./SiteHeader";
import { Sidebar } from "./Sidebar";
import { SidebarList } from "./SidebarList";
import { SearchPalette } from "@/components/navigation/SearchPalette";

/**
 * Everything around a page in one language: the skip link, the header, the
 * sidebar of Parts, and the footer. The English and Bangla layouts and the
 * 404 page use it.
 */
export function SiteShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const items = getNavItems(lang);
  const ui = UI[lang];
  return (
    <div lang={lang}>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:border focus:border-accent focus:bg-bg-raised focus:px-4 focus:py-2 focus:text-sm focus:text-text"
      >
        {ui.skipLink}
      </a>
      <SiteHeader items={items} lang={lang} searchSlot={<SearchPalette lang={lang} />} />
      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-3.5rem)] lg:self-start lg:overflow-y-auto">
          <Suspense fallback={<SidebarList items={items} lang={lang} activeSlug={null} />}>
            <Sidebar items={items} lang={lang} />
          </Suspense>
        </aside>
        <div className="flex min-h-[calc(100vh-3.5rem)] min-w-0 flex-col">
          {/* The inline style beats the global :focus-visible rule for the skip-link target. */}
          <main id="content" tabIndex={-1} style={{ outline: "none" }} className="flex-1">
            {children}
          </main>
          <footer className="mt-24 border-t border-border px-6 py-8 text-xs leading-relaxed text-text-faint">
            <p className="mx-auto max-w-3xl">{ui.footer}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
