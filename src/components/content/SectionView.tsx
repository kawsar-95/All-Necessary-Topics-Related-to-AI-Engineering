"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Block, Section } from "@/lib/content-schema";
import { Inline } from "./Inline";
import { ProseBlocks } from "./ProseBlocks";
import { VOICE_COLOR, VoiceSwitcher } from "./VoiceSwitcher";
import type { Voice } from "./VoiceSwitcher";

function availableVoices(section: Section): Voice[] {
  const voices: Voice[] = [];
  if (section.body.length) voices.push("main");
  if (section.layman.length) voices.push("layman");
  if (section.bangla.length) voices.push("bangla");
  if (voices.length > 1) voices.push("all");
  return voices;
}

/** A Layman's or Bangla version, set apart in its own panel. */
function VoicePanel({
  voice,
  title,
  note,
  blocks,
}: {
  voice: "layman" | "bangla";
  title: string;
  note: string;
  blocks: Block[];
}) {
  const bangla = voice === "bangla";
  const style = {
    "--voice": VOICE_COLOR[voice],
    backgroundColor: `color-mix(in srgb, ${VOICE_COLOR[voice]} 4%, var(--bg))`,
  } as CSSProperties;
  return (
    <aside
      lang={bangla ? "bn" : undefined}
      aria-label={title}
      style={style}
      className={
        "rounded-2xl border border-border border-l-[3px] border-l-[var(--voice)] px-4 py-6 sm:px-7 [&>:last-child]:mb-0 " +
        (bangla ? "font-bengali" : "")
      }
    >
      <header className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-4">
        <span
          className={
            bangla ? "text-[15px] font-semibold" : "font-display text-lg font-medium italic"
          }
          style={{ color: "var(--voice)" }}
        >
          {title}
        </span>
        <span className="text-[13px] text-text-faint">{note}</span>
      </header>
      <ProseBlocks blocks={blocks} />
    </aside>
  );
}

/**
 * One section of a topic: number, title, lede, and the voice switcher.
 * The Technical voice renders as plain prose. The Layman's and Bangla voices
 * render in panels. "All three" stacks them in that order. The choice is
 * local to the section.
 */
export function SectionView({ section }: { section: Section }) {
  const available = availableVoices(section);
  const [voice, setVoice] = useState<Voice>(available[0] ?? "main");
  const show = (v: Exclude<Voice, "all">) =>
    (voice === v || voice === "all") && available.includes(v);

  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-title`}
      className="scroll-mt-24"
    >
      <header>
        <p className="font-mono text-xs font-medium tracking-[0.14em] text-accent">
          {section.num.padStart(2, "0")}
        </p>
        <h2
          id={`${section.id}-title`}
          className="mt-3 font-display text-[clamp(1.75rem,4.2vw,2.375rem)] font-medium leading-[1.12] tracking-[-0.015em] text-balance text-text"
        >
          {section.title}
        </h2>
        <Inline
          as="p"
          html={section.sub}
          className="mt-4 text-lg leading-relaxed text-pretty text-text-dim sm:text-[1.1875rem]"
        />
      </header>

      {available.length > 1 && (
        <div className="mt-8">
          <VoiceSwitcher value={voice} onChange={setVoice} available={available} />
        </div>
      )}

      <div
        key={voice}
        className="voice-fade mt-8 space-y-8 text-[16.5px] leading-[1.75] sm:text-[17px]"
      >
        {show("main") && (
          <div className="[&>:last-child]:mb-0">
            <ProseBlocks blocks={section.body} />
          </div>
        )}
        {show("layman") && (
          <VoicePanel
            voice="layman"
            title="Layman's version"
            note="plain English, no jargon"
            blocks={section.layman}
          />
        )}
        {show("bangla") && (
          <VoicePanel
            voice="bangla"
            title="বাংলা ব্যাখ্যা"
            note="সহজ ভাষায় বিস্তারিত"
            blocks={section.bangla}
          />
        )}
      </div>
    </section>
  );
}
