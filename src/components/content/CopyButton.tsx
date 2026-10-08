"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Copies `text` to the clipboard. If the Clipboard API is not available
 * (for example on plain http), it selects the text of `fallbackTarget` so
 * the reader can copy it by hand.
 */
export function CopyButton({
  text,
  label,
  words,
  fallbackTarget,
}: {
  text: string;
  /** The accessible name of the button, for example "Copy the prompt of step 1". */
  label: string;
  /** The visible words for each state, in the reader's language. */
  words: { idle: string; copied: string; selected: string };
  fallbackTarget: () => HTMLElement | null;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "selected">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const show = (next: "copied" | "selected") => {
    setStatus(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      show("copied");
    } catch {
      const el = fallbackTarget();
      const selection = window.getSelection();
      if (!el || !selection) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      show("selected");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="rounded-md border border-border-strong px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-text-dim transition-colors hover:border-accent hover:text-accent"
    >
      <span aria-live="polite">
        {words[status]}
      </span>
    </button>
  );
}
