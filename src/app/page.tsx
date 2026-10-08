import Link from "next/link";
import { GUIDES, CHAPTERS } from "@/lib/guides";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <section className="mb-16">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent mb-4">
          Reference · {GUIDES.length} guides · {CHAPTERS.length} chapter topics
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
          All necessary topics
          <br />
          <span
            className="bg-gradient-to-br from-accent to-accent-2 bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(120deg, var(--accent) 0%, var(--accent-2) 100%)",
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
          <span className="text-accent-3">বাংলা ব্যাখ্যা</span>.
        </p>
      </section>

      <div className="grid gap-5">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="group block bg-bg-card border border-border rounded-xl p-6 no-underline transition-all hover:border-accent hover:-translate-y-0.5"
          >
            <div className="font-mono text-[11px] tracking-wider text-accent-3 uppercase mb-2">
              {g.sections.length} topic{g.sections.length === 1 ? "" : "s"} ·{" "}
              {g.sources.length} source{g.sources.length === 1 ? "" : "s"}
            </div>
            <h2 className="text-2xl font-bold text-text mb-2 group-hover:text-accent transition-colors">
              {g.title}
            </h2>
            <p
              className="text-text-dim text-sm leading-relaxed m-0"
              dangerouslySetInnerHTML={{ __html: g.lede }}
            />
            <div className="mt-4 inline-flex items-center gap-2 font-mono text-xs text-accent">
              Open guide
              <span aria-hidden>→</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-text-faint mb-3">
          Agents &amp; Agentic Systems — {CHAPTERS.length} chapter topics
        </div>
        <ol className="grid sm:grid-cols-2 gap-3 list-none p-0 m-0">
          {CHAPTERS.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/topics/${c.slug}`}
                className="flex items-baseline gap-3 p-3 bg-bg-card border border-border rounded-lg no-underline transition-all hover:border-accent hover:-translate-y-0.5"
              >
                <span className="font-mono text-xs text-accent shrink-0">
                  {c.num}
                </span>
                <span className="text-text text-sm">
                  <span dangerouslySetInnerHTML={{ __html: c.title }} />
                </span>
                <span className="ml-auto font-mono text-[10px] text-text-faint shrink-0">
                  {c.sources.length} src
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-12 text-xs text-text-faint leading-relaxed">
        Each guide and chapter ships in three voices: the engineer&apos;s
        version (with code and diagrams), the layman&apos;s version (plain
        English with analogies), and বাংলা ব্যাখ্যা.
      </p>
    </div>
  );
}
