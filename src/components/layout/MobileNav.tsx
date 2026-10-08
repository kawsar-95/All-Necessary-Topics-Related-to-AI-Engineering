"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarList, activeSlugFromPath, type NavItem } from "./SidebarList";
import { UI } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The menu button and the left drawer for screens narrower than `lg`.
 * The drawer closes on navigation, on Escape, and on a backdrop click.
 * While it is open, the page does not scroll and Tab stays in the drawer.
 */
export function MobileNav({ items, lang }: { items: NavItem[]; lang: Lang }) {
  const ui = UI[lang];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const panelId = useId();
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close the drawer when the pathname changes (React's "adjust state
  // during render" pattern; no effect needed).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const button = buttonRef.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    // The drawer is not shown at `lg` and wider. Close it if the window grows.
    const wide = window.matchMedia("(min-width: 64rem)");
    function onWide(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      wide.removeEventListener("change", onWide);
      document.body.style.overflow = overflow;
      button?.focus();
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
        className="-ml-2 grid size-9 place-items-center rounded-md text-text-dim transition-colors hover:bg-bg-raised hover:text-text"
      >
        <span className="sr-only">{ui.openParts}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none">
          <path d="M3 5.5h14M3 10h14M3 14.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {/* Visibility flips at once on open, so focus() can reach the drawer.
          On close it waits for the slide-out to end. */}
      <div
        className={
          "fixed inset-0 z-50 " +
          (open
            ? "visible"
            : "invisible transition-[visibility] duration-200 motion-reduce:transition-none")
        }
      >
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className={
            "absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 motion-reduce:transition-none " +
            (open ? "opacity-100" : "opacity-0")
          }
        />
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={
            "absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-border bg-bg shadow-2xl shadow-black/50 transition-transform duration-200 ease-out motion-reduce:transition-none " +
            (open ? "translate-x-0" : "-translate-x-full")
          }
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <span id={titleId} className="font-display text-[17px] font-semibold tracking-tight text-text">
              {ui.siteName}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="-mr-2 grid size-9 place-items-center rounded-md text-text-dim transition-colors hover:bg-bg-raised hover:text-text"
            >
              <span className="sr-only">{ui.closeParts}</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <SidebarList
              items={items}
              lang={lang}
              activeSlug={activeSlugFromPath(pathname)}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
