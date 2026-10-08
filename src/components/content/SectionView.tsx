"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Block, Section } from "@/lib/content-schema";
import { Inline } from "./Inline";
import { ProseBlocks } from "./ProseBlocks";

type Voice = "main" | "layman" | "bangla" | "all";

const VOICE_LABEL: Record<Voice, string> = {
  main: "Technical",
  layman: "Layman's",
  bangla: "বাংলা",
  all: "All three",
};

const VOICE_COLOR: Record<Voice, string> = {
  main: "var(--accent)",
  layman: "var(--voice-layman)",
  bangla: "var(--voice-bangla)",
  all: "var(--text)",
};

function VoiceBody({
  voice,
  blocks,
  showLabel,
}: {
  voice: Exclude<Voice, "all">;
  blocks: Block[];
  showLabel: boolean;
}) {
  const style = { "--voice": VOICE_COLOR[voice] } as CSSProperties;
  return (
    <div lang={voice === "bangla" ? "bn" : undefined} style={style} className={showLabel ? "mt-6" : ""}>
      {showLabel && (
        <div
          className="mb-3 font-mono text-[11px] uppercase tracking-wider"
          style={{ color: VOICE_COLOR[voice] }}
        >
          {VOICE_LABEL[voice]}
        </div>
      )}
      <ProseBlocks blocks={blocks} />
    </div>
  );
}

/**
 * Renders one section of a topic. A voice picker lets the reader read the
 * technical version, the layman's version, the Bangla version, or all three.
 * The default is the technical version. Task 9 replaces this picker.
 */
export function SectionView({ section }: { section: Section }) {
  const [voice, setVoice] = useState<Voice>("main");
  const all = voice === "all";

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

      <Inline as="p" className="sub" html={section.sub} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] uppercase tracking-wider text-text-faint font-mono">
          Voice
        </span>
        {(Object.keys(VOICE_LABEL) as Voice[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVoice(v)}
            aria-pressed={voice === v}
            className="text-xs px-2.5 py-1 rounded-md border transition-colors"
            style={{
              borderColor: voice === v ? VOICE_COLOR[v] : "var(--border)",
              color: voice === v ? VOICE_COLOR[v] : "var(--text-dim)",
              background: voice === v ? `${VOICE_COLOR[v]}15` : "transparent",
            }}
          >
            {VOICE_LABEL[v]}
          </button>
        ))}
      </div>

      {(voice === "main" || all) && (
        <VoiceBody voice="main" blocks={section.body} showLabel={false} />
      )}
      {(voice === "layman" || all) && (
        <VoiceBody voice="layman" blocks={section.layman} showLabel={all} />
      )}
      {(voice === "bangla" || all) && (
        <VoiceBody voice="bangla" blocks={section.bangla} showLabel={all} />
      )}
    </section>
  );
}
