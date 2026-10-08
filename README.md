# All Necessary Topics Related to AI Engineering

A dense, citation-backed Next.js reference for the fundamentals every applied
AI engineer needs — from tokens and tool use to retrieval, context, and agent
loops. Each topic ships in three voices: a technical version (diagrams, code,
cited primary research), a layman's version (plain English with analogies),
and a বাংলা ব্যাখ্যা (Bangla explanation) panel.

## Stack

- **Next.js 16.4** (App Router, statically generated)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4** (CSS-first config via `@theme inline`)

## Routes

| Route                           | What it is                          |
| -------------------------------- | ------------------------------------ |
| `/`                               | Landing page — hero + guide/chapter index |
| `/guides/llm-fundamentals`        | 10 topics, 26 sources                |
| `/guides/prompt-engineering`      | 8 topics, 15 sources                 |
| `/guides/context-engineering`     | 7 topics, 11 sources                 |
| `/guides/rag-knowledge-systems`   | 10 topics, 68 sources                |
| `/topics/01-agents-and-agentic-systems` … `/topics/09-ai-application-architecture` | 9 single-topic chapters, each with prev/next navigation |

## Content

Each guide and chapter is structured JSON in `src/content/*.json`:
`{ slug, title, heroTitle, lede, sections: [{ id, num, title, sub, body,
layman, bangla }], sources }`. `body`, `layman`, and `bangla` are raw HTML
strings (including inline SVG diagrams) rendered verbatim via
`dangerouslySetInnerHTML`, styled by the `.prose-guide` rules in
`globals.css`.

- **`src/lib/guides.ts`** is a typed accessor over the JSON, split into
  `GUIDES` (the four full guides) and `CHAPTERS` (the nine
  Agents & Agentic Systems chapters).
- **`src/app/page.tsx`** is the landing page.
- **`src/app/guides/[slug]/page.tsx`** renders a full guide.
- **`src/app/topics/[slug]/page.tsx`** renders a chapter, with prev/next
  links between chapters.
- **`<SectionView>`** renders one section, exposing a per-section voice
  picker (Technical / Layman's / বাংলা / All three).

To edit content, edit the JSON directly — there is no separate HTML source
to regenerate from.

## Source quality

All citations resolve to:
- **arXiv papers** for the foundational techniques (BPE, SentencePiece, CoT,
  ReAct, Reflexion, MemGPT, LLMLingua, Lost-in-the-Middle, etc.)
- **Vendor documentation** for production patterns (Anthropic prompt
  caching, OpenAI prompt caching, Gemini caching, OpenAI Structured Outputs,
  Anthropic tool use)
- **Anthropic engineering blog** for the context-engineering playbook

## Running it

```bash
# 1. Install
npm install

# 2. Dev mode
npm run dev
# → http://localhost:3000

# 3. Production build + start
npm run build
npm run start
```

The content is fully static — `next build` prerenders every route.

## File layout

```
.
├── src/
│   ├── app/
│   │   ├── layout.tsx                 root layout, fonts, header, footer
│   │   ├── page.tsx                   landing
│   │   ├── not-found.tsx              404
│   │   ├── globals.css                design tokens + .prose-guide rules
│   │   ├── guides/[slug]/page.tsx     full-guide page (dynamic + SSG)
│   │   └── topics/[slug]/page.tsx     chapter page (dynamic + SSG)
│   ├── components/
│   │   ├── SiteHeader.tsx             sticky top nav
│   │   ├── SectionView.tsx            one section + voice picker
│   │   ├── SectionNav.tsx             sticky right-side TOC
│   │   └── Sources.tsx                bottom sources list
│   ├── content/                       guide + chapter JSON (source of truth)
│   └── lib/guides.ts                  typed accessor
├── public/                            static assets
├── screenshots/                       visual reference
└── LICENSE
```

## Design notes

- The dark theme uses `#0b0f17` background, `#22d3ee` cyan accent, `#a78bfa`
  violet for the layman panel, `#34d399` green for the বাংলা panel.
- Inter, JetBrains Mono, and Noto Sans Bengali are loaded via
  `next/font/google` with `display: swap` so missing-font offline builds
  still render.
- The sticky right-side TOC uses `IntersectionObserver` to highlight the
  section currently in view.
- The voice picker is per-section state — opening a new section starts in
  Technical mode, which is the most efficient for serial reading.

## License

[MIT](LICENSE)
