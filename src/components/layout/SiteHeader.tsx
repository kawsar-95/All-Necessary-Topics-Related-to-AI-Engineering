import { Suspense } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/topics";
import { UI, homeHref } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { LanguageSwitch, LanguageSwitchFallback } from "./LanguageSwitch";
import { MobileNav } from "./MobileNav";
import { InstallButton } from "./InstallButton";
import { ThemeToggle } from "./ThemeToggle";

/** The menu button without behavior, shown until MobileNav can render. */
function MenuButtonPlaceholder() {
  return (
    <div className="lg:hidden">
      <span aria-hidden="true" className="-ml-2 grid size-9 place-items-center text-text-faint">
        <svg viewBox="0 0 20 20" className="size-5" fill="none">
          <path d="M3 5.5h14M3 10h14M3 14.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  );
}

/**
 * The sticky top bar: the menu button (below `lg`), the logo, and on the
 * right the search trigger slot, the language switch, the install button,
 * and the theme switch.
 */
export function SiteHeader({
  items,
  lang,
  searchSlot,
}: {
  items: NavItem[];
  lang: Lang;
  searchSlot?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border">
      {/* The blur sits on its own layer. A backdrop-filter on the header
          itself would trap the fixed-position drawer inside the header. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-bg/85 backdrop-blur-md" />
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        <Suspense fallback={<MenuButtonPlaceholder />}>
          <MobileNav items={items} lang={lang} />
        </Suspense>
        <Link href={homeHref(lang)} className="flex min-w-0 items-center gap-2.5 text-text no-underline">
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-md border border-border-strong bg-bg-raised font-display text-[15px] font-semibold italic leading-none text-accent"
          >
            Ai
          </span>
          <span className="truncate font-display text-[17px] font-semibold tracking-tight">
            {UI[lang].siteName}
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {searchSlot}
          <Suspense fallback={<LanguageSwitchFallback lang={lang} />}>
            <LanguageSwitch lang={lang} />
          </Suspense>
          <InstallButton lang={lang} />
          <ThemeToggle lang={lang} />
        </div>
      </div>
    </header>
  );
}
