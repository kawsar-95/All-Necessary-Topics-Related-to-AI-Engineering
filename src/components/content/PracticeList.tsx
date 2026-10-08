"use client";

import { useRef } from "react";
import type { Practice, PracticeStep, PracticeText } from "@/lib/content-schema";
import { CopyButton } from "./CopyButton";
import { Inline } from "./Inline";

type Lang = "en" | "bn";

const CHATS = [
  { name: "ChatGPT", url: "https://chatgpt.com/" },
  { name: "Claude", url: "https://claude.ai/" },
  { name: "Gemini", url: "https://gemini.google.com/" },
];

/** The panel's own words, in each language. */
const UI = {
  en: {
    heading: (n: number) => `Practice · ${n} ${n === 1 ? "task" : "tasks"}`,
    openChat: "Open any free AI chat:",
    howTitle: "How practice works",
    how: [
      "A <strong>new chat</strong> is a fresh conversation with no history. In ChatGPT, Claude, or Gemini, click <em>New chat</em>. It is usually at the top left.",
      "<strong>Same chat</strong> means: keep typing in the chat that is already open. The AI remembers what you sent before.",
      "To use a prompt: click <em>Copy</em>, click in the message box of the chat, paste it (Ctrl+V, or press and hold on a phone), and press Enter.",
      "AI answers are a little different every time. Your answer does not need to match the example word for word. Look for the same idea.",
      "Use made-up data only. Do not paste private information into a chat.",
    ],
    task: (n: number) => `Task ${n}`,
    why: "Why this matters",
    step: (n: number) => `Step ${n}`,
    newChat: "New chat",
    sameChat: "Same chat",
    prompt: "Prompt",
    expect: "You should see:",
    example: "Example answer",
    exampleNote: "Your answer will be worded differently.",
    learned: "What just happened",
    done: "You are done when",
    check: "Check yourself",
    showAnswer: "Show answer",
    challenge: "Try a harder version",
    copy: { idle: "Copy", copied: "Copied", selected: "Selected" },
    copyLabel: (n: number) => `Copy the prompt of step ${n}`,
  },
  bn: {
    heading: (n: number) => `অনুশীলন · ${bnNum(n)}টি task`,
    openChat: "যেকোনো free AI chat খোলো:",
    howTitle: "অনুশীলন কীভাবে করবে",
    how: [
      "<strong>নতুন chat</strong> মানে একদম নতুন কথোপকথন, আগের কোনো history নেই। ChatGPT, Claude বা Gemini-তে <em>New chat</em>-এ click করো। সাধারণত এটা উপরে বাঁ দিকে থাকে।",
      "<strong>একই chat</strong> মানে: যে chat খোলা আছে, সেখানেই লিখতে থাকো। আগে যা পাঠিয়েছ, AI তা মনে রাখে।",
      "Prompt ব্যবহার করতে: <em>Copy</em>-তে click করো, chat-এর message box-এ click করো, paste করো (Ctrl+V, বা phone-এ চেপে ধরে রাখো), তারপর Enter চাপো।",
      "AI-এর উত্তর প্রতিবার একটু আলাদা হয়। তোমার উত্তর example-এর সাথে হুবহু মিলতে হবে না। একই ধারণা আছে কি না, সেটা দেখো।",
      "শুধু বানানো data ব্যবহার করো। নিজের বা অন্যের ব্যক্তিগত তথ্য chat-এ paste করবে না।",
    ],
    task: (n: number) => `Task ${bnNum(n)}`,
    why: "এটা কেন দরকার",
    step: (n: number) => `ধাপ ${bnNum(n)}`,
    newChat: "নতুন chat",
    sameChat: "একই chat",
    prompt: "Prompt",
    expect: "তুমি দেখবে:",
    example: "Example উত্তর",
    exampleNote: "তোমার উত্তরের ভাষা একটু আলাদা হবে।",
    learned: "এইমাত্র কী হলো",
    done: "কাজ শেষ, যখন",
    check: "নিজেকে যাচাই করো",
    showAnswer: "উত্তর দেখো",
    challenge: "আরেকটু কঠিন করে দেখো",
    copy: { idle: "Copy", copied: "Copy হয়েছে", selected: "Select হয়েছে" },
    copyLabel: (n: number) => `ধাপ ${bnNum(n)}-এর prompt copy করো`,
  },
} as const;

function bnNum(n: number): string {
  return new Intl.NumberFormat("bn-BD").format(n);
}

const LABEL =
  "practice-label font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-text-faint";
const BODY = "text-[15px] leading-relaxed";

function PromptBox({ text, label, lang }: { text: string; label: string; lang: Lang }) {
  const textRef = useRef<HTMLPreElement>(null);
  const ui = UI[lang];
  return (
    <figure lang="en" className="m-0 overflow-hidden rounded-lg border border-border bg-code-bg">
      <figcaption className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-1.5">
        <span lang={lang} className={LABEL}>{ui.prompt}</span>
        <CopyButton
          text={text}
          label={label}
          words={ui.copy}
          fallbackTarget={() => textRef.current}
        />
      </figcaption>
      <pre
        ref={textRef}
        lang={lang === "bn" && /[ঀ-৿]/.test(text) ? "bn" : undefined}
        className="m-0 max-h-80 overflow-auto whitespace-pre-wrap break-words px-3.5 py-3 font-mono text-[13px] leading-relaxed text-text"
      >
        {text}
      </pre>
    </figure>
  );
}

function StepItem({ step, n, lang }: { step: PracticeStep; n: number; lang: Lang }) {
  const ui = UI[lang];
  const isNew = step.chat === "new";
  return (
    <li className="relative border-l-2 border-border pb-6 pl-5 last:pb-0">
      <span
        aria-hidden="true"
        className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-accent"
      />
      <div className="flex flex-wrap items-center gap-2">
        <h6 className="m-0 text-[13px] font-semibold text-text">{ui.step(n)}</h6>
        <span
          className={
            "rounded border px-1.5 py-px font-mono text-[10.5px] uppercase tracking-[0.1em] " +
            (isNew ? "border-accent/50 text-accent" : "border-border-strong text-text-faint")
          }
        >
          {isNew ? ui.newChat : ui.sameChat}
        </span>
      </div>
      <Inline as="p" html={step.do} className={`mt-1.5 text-text ${BODY}`} />
      {step.prompt && (
        <div className="mt-3">
          <PromptBox text={step.prompt} label={ui.copyLabel(n)} lang={lang} />
        </div>
      )}
      <p className={`mt-3 text-text-dim ${BODY}`}>
        <span aria-hidden="true" className="mr-1.5 text-good">✓</span>
        <span className="font-medium text-text">{ui.expect}</span>{" "}
        <Inline html={step.expect} />
      </p>
      {step.example && (
        <details className="group mt-2">
          <summary className="cursor-pointer text-[13px] text-accent">
            {ui.example}
          </summary>
          <div className="mt-2 rounded-lg border border-dashed border-border-strong px-3.5 py-3">
            <pre lang={/[ঀ-৿]/.test(step.example) ? "bn" : "en"} className="m-0 whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-text-dim">
              {step.example}
            </pre>
            <p className="mt-2 text-[12px] text-text-faint">{ui.exampleNote}</p>
          </div>
        </details>
      )}
    </li>
  );
}

function PracticeCard({ text, index, lang }: { text: PracticeText; index: number; lang: Lang }) {
  const ui = UI[lang];
  return (
    <article className="rounded-2xl border border-border bg-bg-raised px-4 py-6 sm:px-7">
      <header>
        <p className={LABEL}>{ui.task(index + 1)}</p>
        <h4 className="mt-2 font-display text-xl font-medium leading-snug text-text">
          {text.title}
        </h4>
      </header>

      <h5 className={`${LABEL} mt-5`}>{ui.why}</h5>
      <Inline as="p" html={text.why} className={`mt-2 text-text-dim ${BODY}`} />

      <ol className="mt-6 list-none p-0">
        {text.steps.map((step, i) => (
          <StepItem key={i} step={step} n={i + 1} lang={lang} />
        ))}
      </ol>

      <div className="mt-7 rounded-lg border border-border bg-bg px-4 py-3.5">
        <h5 className={LABEL}>{ui.learned}</h5>
        <Inline as="p" html={text.learned} className={`mt-2 text-text ${BODY}`} />
      </div>

      <p className={`mt-4 text-text ${BODY}`}>
        <span aria-hidden="true" className="mr-1.5 text-good">✔</span>
        <span className="font-medium">{ui.done}</span>{" "}
        <Inline html={text.done} className="text-text-dim" />
      </p>

      <details className="group mt-5 rounded-lg border border-border px-4 py-3">
        <summary className={`cursor-pointer list-none ${BODY} [&::-webkit-details-marker]:hidden`}>
          <span className={`${LABEL} mr-2`}>{ui.check}</span>
          <Inline html={text.check.question} className="text-text" />
          <span className="ml-2 text-[13px] text-accent group-open:hidden">{ui.showAnswer}</span>
        </summary>
        <Inline
          as="p"
          html={text.check.answer}
          className={`mt-3 border-t border-border pt-3 text-text-dim ${BODY}`}
        />
      </details>

      <div
        className={`mt-3 rounded-lg border-l-[3px] border-l-warn px-4 py-3 ${BODY}`}
        style={{ backgroundColor: "color-mix(in srgb, var(--warn) 8%, transparent)" }}
      >
        <span className={`${LABEL} mr-2`}>{ui.challenge}</span>
        <Inline html={text.challenge} />
      </div>
    </article>
  );
}

/** The "Practice" part of a section: guided tasks for any free AI chat. */
export function PracticeList({
  practice,
  sectionId,
  lang,
}: {
  practice: Practice[] | undefined;
  sectionId: string;
  lang: Lang;
}) {
  if (!practice?.length) return null;
  const ui = UI[lang];
  const headingId = `${sectionId}-practice`;
  return (
    <section
      aria-labelledby={headingId}
      lang={lang}
      className={"border-t border-border pt-8 " + (lang === "bn" ? "font-bengali" : "")}
    >
      <h3 id={headingId} className={LABEL}>
        {ui.heading(practice.length)}
      </h3>
      <p className={`mt-2 text-text-dim ${BODY}`}>
        {ui.openChat}{" "}
        {CHATS.map((chat, i) => (
          <span key={chat.name}>
            <a href={chat.url} target="_blank" rel="noreferrer noopener" className="text-accent">
              {chat.name}
            </a>
            {i < CHATS.length - 1 ? " · " : ""}
          </span>
        ))}
      </p>
      <details className="mt-3 rounded-lg border border-border px-4 py-2.5">
        <summary className="cursor-pointer text-[14px] text-text">{ui.howTitle}</summary>
        <ul className={`mt-2 list-disc space-y-1.5 pl-5 text-text-dim ${BODY} marker:text-text-faint`}>
          {ui.how.map((item, i) => (
            <Inline key={i} as="li" html={item} />
          ))}
        </ul>
      </details>
      <div className="mt-5 space-y-5">
        {practice.map((p, i) => (
          <PracticeCard key={p.en.title} text={p[lang]} index={i} lang={lang} />
        ))}
      </div>
    </section>
  );
}
