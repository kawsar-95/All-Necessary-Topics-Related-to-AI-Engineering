"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type MiniSearch from "minisearch";
import { createIndex, runSearch } from "@/lib/search";
import type { SearchDoc } from "@/lib/search";
import { UI, fmtNum } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const FOCUSABLE = 'input, button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Index = MiniSearch<SearchDoc>;
type Status = "idle" | "loading" | "ready" | "error";

/**
 * The search button for the header and the Ctrl/Cmd+K dialog.
 * The page loads the search index of its language (/search-index.json or
 * /bn/search-index.json) on the first open and builds the index in the
 * browser one time.
 */
export function SearchPalette({ lang }: { lang: Lang }) {
  const ui = UI[lang];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [index, setIndex] = useState<Index | null>(null);
  const statusRef = useRef<Status>("idle");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const titleId = useId();

  const load = useCallback(async () => {
    if (statusRef.current === "loading" || statusRef.current === "ready") return;
    statusRef.current = "loading";
    setStatus("loading");
    try {
      // fetch() does not add basePath the way next/link does.
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH}${lang === "bn" ? "/bn" : ""}/search-index.json`);
      if (!response.ok) throw new Error(`Search index: HTTP ${response.status}`);
      const docs = (await response.json()) as SearchDoc[];
      setIndex(createIndex(docs));
      statusRef.current = "ready";
      setStatus("ready");
    } catch {
      statusRef.current = "error";
      setStatus("error");
    }
  }, [lang]);

  const openPalette = useCallback(() => {
    setQuery("");
    setSelected(0);
    setOpen(true);
    void load();
  }, [load]);

  // Ctrl+K and Cmd+K open the dialog from anywhere on the page.
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openPalette]);

  // While the dialog is open: focus the input, lock the page scroll, and
  // give the focus back to the button on close.
  useEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      button?.focus();
    };
  }, [open]);

  const hits = useMemo(
    () => (index ? runSearch(index, query) : []),
    [index, query],
  );
  const active = Math.min(selected, Math.max(hits.length - 1, 0));
  const optionId = (i: number) => `${listId}-option-${i}`;

  // Keep the selected row in view when the arrow keys move it.
  useEffect(() => {
    if (!open || hits.length === 0) return;
    document.getElementById(`${listId}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, hits, active, listId]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      // React listens on the document, as the mobile drawer does. Stop the
      // native event there, so the drawer does not also close.
      event.preventDefault();
      event.nativeEvent.stopImmediatePropagation();
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (hits.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setSelected((active + step + hits.length) % hits.length);
      return;
    }
    if (event.key === "Enter") {
      if (event.nativeEvent.isComposing) return;
      event.preventDefault();
      const hit = hits[active];
      if (hit) go(hit.href);
      return;
    }
    if (event.key === "Tab" && dialogRef.current) {
      // Keep the focus inside the dialog.
      const nodes = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
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
  }

  let message: string | null = null;
  if (status === "error") message = ui.searchUnavailable;
  else if (query.trim() === "") message = ui.searchType;
  else if (status !== "ready") message = ui.searchLoading;
  else if (hits.length === 0) message = ui.searchNone;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ui.search}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts="Control+K Meta+K"
        onClick={openPalette}
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-bg-raised/60 px-2.5 text-sm text-text-dim transition-colors hover:border-border-strong hover:text-text sm:min-w-52"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0" fill="none">
          <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M13.2 13.2L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span aria-hidden="true" className="hidden flex-1 text-left sm:inline">
          {ui.search}
        </span>
        <kbd
          aria-hidden="true"
          className="hidden rounded border border-border-strong px-1.5 py-0.5 font-mono text-[11px] leading-none text-text-faint sm:inline"
        >
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]">
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={onDialogKeyDown}
            className="relative flex max-h-[min(34rem,80vh)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border-strong bg-bg-raised shadow-2xl shadow-black/60"
          >
            <h2 id={titleId} className="sr-only">
              {ui.searchAll}
            </h2>
            <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 focus-within:border-accent focus-within:shadow-[inset_0_-2px_0_var(--accent)]">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0 text-text-faint" fill="none">
                <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M13.2 13.2L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-label={ui.searchAll}
                aria-expanded={hits.length > 0}
                aria-controls={listId}
                aria-activedescendant={hits.length > 0 ? optionId(active) : undefined}
                aria-autocomplete="list"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder={ui.searchAll}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelected(0);
                }}
                // The global :focus-visible rule is not in a layer, so it beats
                // the outline utilities. The inline style wins over it.
                style={{ outline: "none" }}
                className="h-12 min-w-0 flex-1 bg-transparent text-base text-text placeholder:text-text-faint"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-border-strong px-1.5 py-1 font-mono text-[11px] leading-none text-text-faint transition-colors hover:text-text"
              >
                <span aria-hidden="true">Esc</span>
                <span className="sr-only">{ui.searchClose}</span>
              </button>
            </div>

            <div
              id={listId}
              role="listbox"
              aria-label={ui.searchResults}
              hidden={hits.length === 0}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
            >
              {hits.map((hit, i) => (
                <div
                  key={hit.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setSelected(i)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => go(hit.href)}
                  className={
                    "cursor-pointer rounded-md px-3 py-2.5 " +
                    (i === active
                      ? "bg-bg-raised-2 shadow-[inset_2px_0_0_var(--accent)]"
                      : "")
                  }
                >
                  <div className="font-mono text-[11px] uppercase tracking-wide text-text-faint">
                    {ui.part(fmtNum(lang, hit.part))} · {hit.topic}
                  </div>
                  <div className={"mt-0.5 text-[15px] " + (i === active ? "text-text" : "text-text-dim")}>
                    {hit.title}
                  </div>
                </div>
              ))}
            </div>

            <p
              role="status"
              hidden={message === null}
              className="px-4 py-6 text-center text-sm text-text-dim"
            >
              {message}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
