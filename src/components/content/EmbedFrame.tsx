"use client";

import { useEffect, useRef, useState } from "react";
import type { Embed } from "@/lib/content-schema";
import { httpsHost } from "@/lib/content-schema";
import { UI } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { Inline } from "./Inline";

const DEFAULT_HEIGHT = 640;
const MIN_SCALE = 0.55;

/**
 * A live page from another site. Nothing loads from that site until the
 * reader clicks, or, for a light page marked `autoload`, until the frame is
 * near the screen. A page that the publisher does not allow in a frame
 * shows as a link card.
 */
export function EmbedFrame({ embed, lang }: { embed: Embed; lang: Lang }) {
  const ui = UI[lang];
  const frameable = embed.frame !== false;
  const [loaded, setLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  const host = (httpsHost(embed.url) ?? "").replace(/^www\./, "");
  const height = embed.height ?? DEFAULT_HEIGHT;
  const note = lang === "bn" ? embed.noteBn : embed.note;

  // An app that needs a wide screen keeps its design width and shrinks to
  // fit the column. Below MIN_SCALE it falls back to the column width.
  useEffect(() => {
    const el = box.current;
    const design = embed.designWidth;
    if (!design || !el) return;
    const observer = new ResizeObserver((entries) => {
      const k = (entries[0]?.contentRect.width ?? design) / design;
      setScale(k >= MIN_SCALE && k < 1 ? k : 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [embed.designWidth]);

  useEffect(() => {
    const el = box.current;
    if (!embed.autoload || !frameable || loaded || !el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [embed.autoload, frameable, loaded]);

  return (
    <figure className="m-0 overflow-hidden rounded-xl border border-border bg-bg-raised">
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
        <span className="min-w-0">
          <span className="block text-[15px] font-medium leading-snug text-text">{embed.title}</span>
          <span className="block truncate font-mono text-[12px] text-text-faint">{host}</span>
        </span>
        <a
          href={embed.url}
          target="_blank"
          rel="noreferrer noopener"
          className="shrink-0 text-[13px] text-accent no-underline hover:underline"
        >
          {ui.liveOpen} ↗
        </a>
      </figcaption>

      <div ref={box}>
        {frameable && loaded ? (
          <div style={{ height: height * scale }} className="w-full overflow-hidden">
            <iframe
              src={embed.url}
              title={embed.title}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
              allow="fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              className="block border-0 bg-white"
              style={
                scale < 1 && embed.designWidth
                  ? { width: embed.designWidth, height, transform: `scale(${scale})`, transformOrigin: "0 0" }
                  : { width: "100%", height }
              }
            />
          </div>
        ) : (
          <div className="flex min-h-[200px] flex-col items-start justify-center gap-3 px-5 py-6">
            <Inline
              as="p"
              html={note}
              className={"m-0 text-[15px] leading-relaxed text-text-dim " + (lang === "bn" ? "font-bengali" : "")}
            />
            {frameable ? (
              <>
                <button
                  type="button"
                  onClick={() => setLoaded(true)}
                  aria-label={ui.liveLoadLabel(embed.title)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-strong bg-bg px-4 py-2 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                  {ui.liveLoad}
                </button>
                <p className="m-0 text-[12.5px] text-text-faint">
                  {ui.liveLoadHint} {ui.liveWide}
                </p>
              </>
            ) : (
              <a
                href={embed.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-bg px-4 py-2 text-sm font-medium text-text no-underline transition-colors hover:border-accent hover:text-accent"
              >
                {ui.liveOpen} ↗
              </a>
            )}
          </div>
        )}
      </div>

      {frameable && loaded && (
        <p className="m-0 border-t border-border px-4 py-2.5 text-[13px] text-text-dim">
          <Inline
            as="span"
            html={note}
            className={lang === "bn" ? "font-bengali" : ""}
          />
        </p>
      )}
    </figure>
  );
}
