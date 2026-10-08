import Link from "next/link";
import { TOPICS } from "@/lib/topics";
import { Inline } from "@/components/content/Inline";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <section className="mb-16">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent mb-4">
          Reference · {TOPICS.length} parts
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
          All necessary topics
          <br />
          <span
            className="bg-gradient-to-br from-accent to-voice-layman bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(120deg, var(--accent) 0%, var(--voice-layman) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            related to AI Engineering
          </span>
        </h1>
        <p className="text-lg text-text-dim max-w-2xl leading-relaxed">
          A dense, citation-backed reference for the fundamentals every
          applied AI engineer needs — from tokens and tool use to retrieval,
          context, and agent loops. Each topic ships in three voices: the
          engineer&apos;s version (with code and diagrams), the layman&apos;s
          version (plain English with analogies), and{" "}
          <span className="text-voice-bangla">বাংলা ব্যাখ্যা</span>.
        </p>
      </section>

      <ol className="grid gap-5 list-none p-0 m-0">
        {TOPICS.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/topics/${t.slug}`}
              className="group block bg-bg-raised border border-border rounded-xl p-6 no-underline transition-all hover:border-accent hover:-translate-y-0.5"
            >
              <div className="font-mono text-[11px] tracking-wider text-voice-bangla uppercase mb-2">
                Part {t.part} · {t.sections.length} section
                {t.sections.length === 1 ? "" : "s"} · {t.sources.length} source
                {t.sources.length === 1 ? "" : "s"}
              </div>
              <h2 className="text-2xl font-bold text-text mb-2 group-hover:text-accent transition-colors">
                {t.title}
              </h2>
              <Inline
                as="p"
                html={t.lede}
                className="text-text-dim text-sm leading-relaxed m-0"
              />
              <div className="mt-4 inline-flex items-center gap-2 font-mono text-xs text-accent">
                Open part
                <span aria-hidden>→</span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
