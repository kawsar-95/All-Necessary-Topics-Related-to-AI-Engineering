"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Block, Section } from "@/lib/content-schema";
import { videosForVoice } from "@/lib/videos";
import { Inline } from "./Inline";
import { PracticeList } from "./PracticeList";
import { ProseBlocks } from "./ProseBlocks";
import { VideoList } from "./VideoList";
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

/** The ids of all heading blocks in a block list, nested blocks included. */
function headingIds(blocks: Block[]): string[] {
  return blocks.flatMap((block): string[] => {
    switch (block.type) {
      case "heading":
        return [block.id];
      case "callout":
      case "analogy":
        return headingIds(block.blocks);
      case "panels":
        return block.panels.flatMap((panel) => headingIds(panel.blocks));
      default:
        return [];
    }
  });
}

/** The element id that a hash or an in-page href points to, or null. */
function idFromHash(hash: string): string | null {
  if (!hash.startsWith("#") || hash.length < 2) return null;
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
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

  // A link to a heading of the Technical body (for example a TOC entry)
  // must work in every voice. If this section shows only Layman's or
  // Bangla, switch it to Technical and scroll to the heading after the
  // render.
  const bodyHeadings = useMemo(() => new Set(headingIds(section.body)), [section.body]);
  const voiceRef = useRef(voice);
  const pendingScroll = useRef<string | null>(null);

  useEffect(() => {
    voiceRef.current = voice;
    const id = pendingScroll.current;
    if (!id) return;
    pendingScroll.current = null;
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scroll = () => el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // The voice-fade rise moves the heading 4px. Scroll when it ends, so the
    // scroll target is the heading's final position.
    const fades = el.closest(".voice-fade")?.getAnimations() ?? [];
    if (fades.length) Promise.all(fades.map((a) => a.finished)).then(scroll, scroll);
    else scroll();
  }, [voice]);

  useEffect(() => {
    const reveal = (hash: string) => {
      const id = idFromHash(hash);
      if (!id || !bodyHeadings.has(id)) return;
      const current = voiceRef.current;
      if (current !== "layman" && current !== "bangla") return;
      pendingScroll.current = id;
      voiceRef.current = "main";
      setVoice("main");
    };
    // A click covers a repeat click on the same link: the hash does not
    // change, so no hashchange event fires.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
      if (link) reveal(link.getAttribute("href") ?? "");
    };
    const onHashChange = () => reveal(window.location.hash);

    reveal(window.location.hash);
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [bodyHeadings]);

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
        <PracticeList sectionId={section.id} practice={section.practice} />
        <VideoList sectionId={section.id} videos={videosForVoice(section.videos, voice)} />
      </div>
    </section>
  );
}
