"use client";

import { useEffect, useState } from "react";
import type { Section } from "@/lib/content-schema";

/**
 * Sticky in-page table of contents for a guide. Shows the section number and
 * title, highlights the section currently in view, and smooth-scrolls on
 * click. Hidden on small screens to keep the reading column readable.
 */
export function SectionNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive((e.target as HTMLElement).id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="On this page"
      className="hidden lg:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 text-sm"
    >
      <div className="text-[11px] uppercase tracking-wider text-text-faint font-mono mb-3">
        On this page
      </div>
      <ul className="space-y-1 border-l border-border">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id} className="relative">
              <a
                href={`#${s.id}`}
                className="block pl-3 pr-2 py-1 -ml-px border-l-2 transition-colors no-underline"
                style={{
                  borderColor: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "var(--text)" : "var(--text-dim)",
                }}
              >
                <span className="font-mono text-[11px] text-text-faint mr-2">
                  {s.num}
                </span>
                {s.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
