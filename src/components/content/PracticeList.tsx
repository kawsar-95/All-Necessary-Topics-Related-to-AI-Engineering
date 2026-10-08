"use client";

import { useRef } from "react";
import type { Practice, PracticePrompt } from "@/lib/content-schema";
import { CopyButton } from "./CopyButton";
import { Inline } from "./Inline";

const CHATS = [
  { name: "ChatGPT", url: "https://chatgpt.com/" },
  { name: "Claude", url: "https://claude.ai/" },
  { name: "Gemini", url: "https://gemini.google.com/" },
];

const LABEL =
  "font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-text-faint";

function PromptBox({ prompt }: { prompt: PracticePrompt }) {
  const textRef = useRef<HTMLPreElement>(null);
  return (
    <figure className="m-0 overflow-hidden rounded-lg border border-border bg-code-bg">
      <figcaption className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-2">
        <span className="text-[13px] font-medium text-text">{prompt.label}</span>
        <CopyButton text={prompt.text} label={prompt.label} fallbackTarget={() => textRef.current} />
      </figcaption>
      <pre
        ref={textRef}
        className="m-0 max-h-80 overflow-auto whitespace-pre-wrap break-words px-3.5 py-3 font-mono text-[13px] leading-relaxed text-text"
      >
        {prompt.text}
      </pre>
    </figure>
  );
}

function PracticeCard({ practice, index }: { practice: Practice; index: number }) {
  return (
    <article className="rounded-2xl border border-border bg-bg-raised px-4 py-6 sm:px-7">
      <header>
        <p className={LABEL}>Task {index + 1}</p>
        <h4 className="mt-2 font-display text-xl font-medium leading-snug text-text">
          {practice.title}
        </h4>
        <Inline as="p" html={practice.goal} className="mt-2 text-[15px] leading-relaxed text-text-dim" />
      </header>

      <h5 className={`${LABEL} mt-6`}>Steps</h5>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed marker:text-text-faint">
        <li>
          Open any free AI chat:{" "}
          {CHATS.map((chat, i) => (
            <span key={chat.name}>
              <a href={chat.url} target="_blank" rel="noreferrer noopener" className="text-accent">
                {chat.name}
              </a>
              {i < CHATS.length - 2 ? ", " : i === CHATS.length - 2 ? ", or " : "."}
            </span>
          ))}
        </li>
        {practice.steps.map((step, i) => (
          <Inline key={i} as="li" html={step} />
        ))}
      </ol>

      <div className="mt-5 flex flex-col gap-3">
        {practice.prompts.map((prompt) => (
          <PromptBox key={prompt.label} prompt={prompt} />
        ))}
      </div>

      <h5 className={`${LABEL} mt-6`}>Look for</h5>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed marker:text-text-faint">
        {practice.lookFor.map((item, i) => (
          <Inline key={i} as="li" html={item} />
        ))}
      </ul>

      <details className="group mt-6 rounded-lg border border-border px-4 py-3">
        <summary className="cursor-pointer list-none text-[15px] leading-relaxed [&::-webkit-details-marker]:hidden">
          <span className={`${LABEL} mr-2`}>Check yourself</span>
          <Inline html={practice.check.question} className="text-text" />
          <span className="ml-2 text-[13px] text-accent group-open:hidden">Show answer</span>
        </summary>
        <Inline
          as="p"
          html={practice.check.answer}
          className="mt-3 border-t border-border pt-3 text-[15px] leading-relaxed text-text-dim"
        />
      </details>

      <div
        className="mt-4 rounded-lg border-l-[3px] border-l-warn px-4 py-3 text-[15px] leading-relaxed"
        style={{ backgroundColor: "color-mix(in srgb, var(--warn) 8%, transparent)" }}
      >
        <span className={`${LABEL} mr-2`}>Challenge</span>
        <Inline html={practice.challenge} />
      </div>
    </article>
  );
}

/** The "Practice" part of a section: hands-on tasks for any free AI chat. */
export function PracticeList({
  practice,
  sectionId,
}: {
  practice: Practice[] | undefined;
  sectionId: string;
}) {
  if (!practice?.length) return null;
  const headingId = `${sectionId}-practice`;
  return (
    <section aria-labelledby={headingId} className="border-t border-border pt-8">
      <h3 id={headingId} className={LABEL}>
        Practice · {practice.length} {practice.length === 1 ? "task" : "tasks"}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-text-faint">
        Do it yourself in any free AI chat. Use made-up data only. Do not paste private
        information into a chat. Answers change between models and runs.
      </p>
      <div className="mt-4 space-y-5">
        {practice.map((p, i) => (
          <PracticeCard key={p.title} practice={p} index={i} />
        ))}
      </div>
    </section>
  );
}
