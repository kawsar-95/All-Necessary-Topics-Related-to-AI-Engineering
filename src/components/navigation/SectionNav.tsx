"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

// The same shape as OutlineItem in src/lib/topics.ts. A client file must not
// import topics.ts, so the page passes OutlineItem[] in and TypeScript checks
// that it fits this type.
type TocItem = { id: string; title: string; level: 2 | 3 };

/** The reading line: an item is current when its top is above this point. */
const LINE = 0.3;

/**
 * The sticky "On this page" list. It marks the last outline item whose top
 * has passed the reading line. The observer band ends at that line, so it
 * fires each time a top crosses it.
 */
export function SectionNav({ items, lang }: { items: TocItem[]; lang: Lang }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // Look the ids up again on each update: a voice switch can remove or
    // replace the h3 elements of a section.
    const update = () => {
      const line = window.innerHeight * LINE;
      let current: string | null = null;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= line) current = item.id;
      }
      setActive(current);
    };

    const observer = new IntersectionObserver(update, {
      rootMargin: `0px 0px -${(1 - LINE) * 100}% 0px`,
      threshold: 0,
    });
    const observed = new Set<Element>();
    const observeAll = () => {
      for (const el of observed) {
        if (!el.isConnected) {
          observer.unobserve(el);
          observed.delete(el);
        }
      }
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && !observed.has(el)) {
          observer.observe(el);
          observed.add(el);
        }
      }
    };
    observeAll();

    // A voice switch puts new heading elements in the page. Observe them too.
    const article = document.getElementById(items[0]?.id ?? "")?.parentElement ?? document.body;
    const mutations = new MutationObserver(observeAll);
    mutations.observe(article, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, [items]);

  return (
    <nav
      aria-label={UI[lang].onThisPage}
      className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-6"
    >
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-text-faint">
        {UI[lang].onThisPage}
      </p>
      <ol className="m-0 list-none border-l border-border p-0">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={
                  "-ml-px block border-l-2 py-1.5 pr-2 leading-snug no-underline transition-colors " +
                  (item.level === 3 ? "pl-7 text-[12.5px] " : "pl-4 text-[13.5px] ") +
                  (isActive
                    ? "border-accent text-text"
                    : "border-transparent text-text-dim hover:border-border-strong hover:text-text")
                }
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
