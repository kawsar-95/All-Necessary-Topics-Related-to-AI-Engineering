"use client";

import { useState } from "react";
import type { Video } from "@/lib/content-schema";
import { UI } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

/**
 * A YouTube video as a thumbnail card. Nothing loads from YouTube until the
 * reader clicks: then the card swaps in the youtube-nocookie player.
 */
export function VideoCard({ video, lang }: { video: Video; lang: Lang }) {
  const [playing, setPlaying] = useState(false);
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <figure className="m-0 overflow-hidden rounded-xl border border-border bg-bg-raised">
      <div className="relative aspect-video bg-bg-raised-2">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={UI[lang].playVideo(video.title)}
            className="group absolute inset-0 block h-full w-full cursor-pointer p-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static export has no image optimizer */}
            <img
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-85 transition-opacity group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-bg/80 text-accent ring-1 ring-border-strong backdrop-blur-sm transition-transform group-hover:scale-110"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="px-4 py-3">
        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer noopener"
          lang={video.lang === "bn" ? "bn" : undefined}
          className={
            "line-clamp-2 text-[15px] leading-snug text-text no-underline hover:text-accent " +
            (video.lang === "bn" ? "font-bengali" : "")
          }
        >
          {video.title}
        </a>
        <p className="mt-1.5 flex items-center gap-2 text-[13px] text-text-faint">
          <span className="truncate">{video.channel}</span>
          {video.lang === "bn" && (
            <span className="shrink-0 rounded border border-voice-bangla/40 px-1.5 font-bengali text-[11px] text-voice-bangla">
              বাংলা
            </span>
          )}
        </p>
      </figcaption>
    </figure>
  );
}
