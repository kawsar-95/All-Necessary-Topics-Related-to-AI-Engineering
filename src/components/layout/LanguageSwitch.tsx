"use client";

import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { LANG_STORAGE_KEY, UI, homeHref, localizedPath } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const CLASS =
  "grid h-9 shrink-0 place-items-center rounded-md border border-border bg-bg-raised/60 px-2.5 text-[13px] font-medium text-text-dim no-underline transition-colors hover:border-border-strong hover:text-text";

function save(lang: Lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Storage is blocked: the link still opens the other language.
  }
}

/**
 * The link to the same page in the other language. It saves the choice,
 * so the head script (langInitScript) opens later visits in that language.
 * The URL hash (the section in view) comes along.
 */
export function LanguageSwitch({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const other: Lang = lang === "en" ? "bn" : "en";
  const href = BASE + localizedPath(pathname ?? homeHref(lang), other);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Save on every click, also one that opens a new tab, so the new page
    // does not send the reader back.
    save(other);
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.location.assign(href + window.location.hash);
  };

  return (
    <a
      href={href}
      hrefLang={other}
      lang={other}
      onClick={onClick}
      onAuxClick={() => save(other)}
      aria-label={UI[lang].langSwitchLabel}
      title={UI[lang].langSwitchLabel}
      className={CLASS}
    >
      {UI[lang].langSwitchText}
    </a>
  );
}

/** The switch before hydration: a plain link to the other home page. */
export function LanguageSwitchFallback({ lang }: { lang: Lang }) {
  const other: Lang = lang === "en" ? "bn" : "en";
  return (
    <a href={BASE + homeHref(other)} hrefLang={other} lang={other} aria-label={UI[lang].langSwitchLabel} className={CLASS}>
      {UI[lang].langSwitchText}
    </a>
  );
}
