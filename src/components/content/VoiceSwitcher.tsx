"use client";

import { useRef } from "react";
import type { CSSProperties, KeyboardEvent } from "react";

export type Voice = "main" | "layman" | "bangla" | "all";

export const VOICE_LABEL: Record<Voice, string> = {
  main: "Technical",
  layman: "Layman's",
  bangla: "বাংলা",
  all: "All three",
};

export const VOICE_COLOR: Record<Voice, string> = {
  main: "var(--accent)",
  layman: "var(--voice-layman)",
  bangla: "var(--voice-bangla)",
  all: "var(--text)",
};

/**
 * A segmented control that picks the voice of one section. Left and Right
 * arrows (and Home and End) move to the next option and select it. Only the
 * selected button is in the tab order (roving focus).
 */
export function VoiceSwitcher({
  value,
  onChange,
  available,
}: {
  value: Voice;
  onChange: (v: Voice) => void;
  available: Voice[];
}) {
  const buttons = useRef<Map<Voice, HTMLButtonElement>>(new Map());

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const i = available.indexOf(value);
    let next: number;
    if (event.key === "ArrowRight") next = (i + 1) % available.length;
    else if (event.key === "ArrowLeft") next = (i - 1 + available.length) % available.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = available.length - 1;
    else return;
    event.preventDefault();
    const voice = available[next];
    onChange(voice);
    buttons.current.get(voice)?.focus();
  }

  return (
    <div
      role="group"
      aria-label="Voice"
      onKeyDown={onKeyDown}
      className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border bg-bg-raised p-1"
    >
      {available.map((v) => {
        const active = v === value;
        const color = VOICE_COLOR[v];
        const style: CSSProperties | undefined = active
          ? {
              color,
              borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
            }
          : undefined;
        return (
          <button
            key={v}
            ref={(el) => {
              if (el) buttons.current.set(v, el);
              else buttons.current.delete(v);
            }}
            type="button"
            aria-pressed={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(v)}
            lang={v === "bangla" ? "bn" : undefined}
            style={style}
            className={
              "rounded-lg border px-3 py-1.5 text-[13px] leading-5 font-medium transition-colors " +
              (active
                ? ""
                : "border-transparent text-text-dim hover:bg-bg-raised-2 hover:text-text")
            }
          >
            {VOICE_LABEL[v]}
          </button>
        );
      })}
    </div>
  );
}
