"use client";

import { useState } from "react";
import type { Section } from "@/lib/guides";

type Voice = "main" | "layman" | "bangla" | "all";

const VOICE_LABEL: Record<Voice, string> = {
  main: "Technical",
  layman: "Layman's",
  bangla: "বাংলা",
  all: "All three",
};

const VOICE_COLOR: Record<Voice, string> = {
  main: "var(--accent)",
  layman: "var(--accent-2)",
  bangla: "var(--accent-3)",
  all: "var(--text)",
};

/**
 * Renders a section of a guide. The body / layman / bangla strings are HTML
 * stored in src/content/*.json — they preserve the inline SVGs, citation
 * anchors, syntax-coloured code, callouts, and tables. We render them
 * verbatim via dangerouslySetInnerHTML and style them with the
 * `.prose-guide` rules in globals.css.
 *
 * A small voice-picker lets the reader focus on the technical version, the
 * layman's analogy, the Bangla explanation, or all three side-by-side. The
 * default is `main` (the technical version) so dense readers aren't slowed
 * down; the aside panels are still visible at the bottom of each section.
 */
export function SectionView({ section }: { section: Section }) {
  const [voice, setVoice] = useState<Voice>("main");

  return (
    <section
      id={section.id}
      className="prose-guide scroll-mt-20"
      aria-labelledby={`${section.id}-title`}
    >
      <div className="section-head">
        <span className="section-num">{section.num}</span>
        <h2 id={`${section.id}-title`}>{section.title}</h2>
      </div>

      {/* The sub is HTML in the source (contains <strong> and citation
          anchors); render it as such rather than escaping the tags. */}
      <p
        className="sub"
        dangerouslySetInnerHTML={{ __html: section.sub }}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] uppercase tracking-wider text-text-faint font-mono">
          Voice
        </span>
        {(Object.keys(VOICE_LABEL) as Voice[]).map((v) => (
          <button
            key={v}
            onClick={() => setVoice(v)}
            className="text-xs px-2.5 py-1 rounded-md border transition-colors"
            style={{
              borderColor: voice === v ? VOICE_COLOR[v] : "var(--border)",
              color: voice === v ? VOICE_COLOR[v] : "var(--text-dim)",
              background:
                voice === v ? `${VOICE_COLOR[v]}15` : "transparent",
            }}
          >
            {VOICE_LABEL[v]}
          </button>
        ))}
      </div>

      {(voice === "main" || voice === "all") && (
        <div dangerouslySetInnerHTML={{ __html: section.body }} />
      )}

      {(voice === "layman" || voice === "all") && (
        <div
          className={voice === "all" ? "mt-4" : ""}
          dangerouslySetInnerHTML={{ __html: section.layman }}
        />
      )}

      {(voice === "bangla" || voice === "all") && (
        <div
          className={voice === "all" ? "mt-4" : ""}
          dangerouslySetInnerHTML={{ __html: section.bangla }}
        />
      )}
    </section>
  );
}
