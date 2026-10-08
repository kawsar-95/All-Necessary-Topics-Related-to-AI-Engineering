"use client";

import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, nextTheme, resolveTheme } from "@/lib/theme";
import type { Theme } from "@/lib/theme";

const LIGHT_QUERY = "(prefers-color-scheme: light)";

function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/** data-theme on <html> is the source of truth. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/**
 * The light/dark switch in the header. The inline script from
 * src/lib/theme.ts sets the theme before the first paint; this button
 * changes it and saves the choice. The icon comes from CSS, so it is right
 * before hydration too.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => null);

  // In development, React's Strict Mode remount clears data-theme on <html>.
  // Set it again before paint. In production this changes nothing.
  useLayoutEffect(() => {
    apply(resolveTheme(readStored(), window.matchMedia(LIGHT_QUERY).matches));
  }, []);

  // With no saved choice, follow changes of the device setting.
  useEffect(() => {
    const query = window.matchMedia(LIGHT_QUERY);
    const onChange = () => {
      if (readStored() === null) apply(query.matches ? "light" : "dark");
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = nextTheme(getTheme());
    apply(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage is blocked: the theme still changes for this page.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme ? `Switch to ${nextTheme(theme)} theme` : "Switch color theme"}
      title={theme ? `Switch to ${nextTheme(theme)} theme` : "Switch color theme"}
      className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-bg-raised/60 text-text-dim transition-colors hover:border-border-strong hover:text-text"
    >
      {/* Sun: shown in the dark theme (switches to light). */}
      <svg viewBox="0 0 20 20" className="size-[18px] light:hidden" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      {/* Moon: shown in the light theme (switches to dark). */}
      <svg viewBox="0 0 20 20" className="hidden size-[18px] light:block" fill="none" aria-hidden="true">
        <path
          d="M16.5 12.3A7 7 0 0 1 7.7 3.5a7 7 0 1 0 8.8 8.8Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
