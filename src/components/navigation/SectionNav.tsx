"use client";

import { useEffect, useState } from "react";

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
export function SectionNav({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!elements.length) return;

    // Look the ids up again on each update: a voice switch can replace the
    // h3 elements of a section.
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
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-6"
    >
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-text-faint">
        On this page
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
