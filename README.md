# All Necessary Topics Related to AI Engineering

A citation-backed Next.js reference for the topics an applied AI engineer
needs. It has 13 parts, from LLM fundamentals to AI application
architecture. Each topic has three voices: Technical (diagrams, code, cited
sources), Layman's (plain English with analogies), and বাংলা (Bangla
explanation).

Live site: https://kawsar-95.github.io/All-Necessary-Topics-Related-to-AI-Engineering/

## Stack

- **Next.js 16.4** (App Router, static export)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4** (CSS-first config in `globals.css`)
- **Zod 4** (content validation at build time)
- **MiniSearch** (search in the browser)

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # validates content, then writes the static site to out/
npm test         # runs the tests in tests/
npm run lint
npx serve out    # previews the static build at http://localhost:3000
```

`npm run start` does not work. The site is a static export, so `next start`
has no server build to serve.

## Hosting

The site runs on GitHub Pages. `.github/workflows/deploy-pages.yml` runs on
every push to `main`, and you can also start it from the Actions tab. It:

1. Installs dependencies and runs the tests.
2. Builds the static site with `PAGES_BASE_PATH` set to
   `/All-Necessary-Topics-Related-to-AI-Engineering`.
3. Publishes `out/` to GitHub Pages.

`next.config.ts` reads `PAGES_BASE_PATH` as the `basePath`. Local builds do
not set it, so the site serves from `/`. Code that builds a URL by hand
(not through `next/link` or the router) must add
`process.env.NEXT_PUBLIC_BASE_PATH`, as the search palette does.

## Routes

| Route                       | What it is                                         |
| --------------------------- | -------------------------------------------------- |
| `/`                         | Landing page. An index of the 13 parts.            |
| `/topics/<slug>`            | One part, with prev/next links and an outline.     |
| `/search-index.json`        | The search index. Built at build time.             |

The 13 parts, in order:

| Part | Route                                      |
| ---- | ------------------------------------------ |
| 1    | `/topics/llm-fundamentals`                 |
| 2    | `/topics/prompt-engineering`               |
| 3    | `/topics/context-engineering`              |
| 4    | `/topics/rag-knowledge-systems`            |
| 5    | `/topics/agents-and-agentic-systems`       |
| 6    | `/topics/tool-use-and-integrations`        |
| 7    | `/topics/inference`                        |
| 8    | `/topics/llmops-and-observability`         |
| 9    | `/topics/evaluation-engineering`           |
| 10   | `/topics/cost-and-performance-optimization` |
| 11   | `/topics/safety-security-and-guardrails`   |
| 12   | `/topics/multimodal-engineering`           |
| 13   | `/topics/ai-application-architecture`      |

The order is set in one place: `TOPIC_ORDER` in `src/lib/topics.ts`.

Only these 13 slugs exist. Any other URL gets the 404 page.

## Content

Each part is one file: `src/content/<slug>.json`. To edit content, edit that
file. `npm run build` validates every file against the schema. A bad file
fails the build.

The schema is in [`src/lib/content-schema.ts`](src/lib/content-schema.ts).
A file has this shape:

```
{ slug, title, tagline?, lede, sections: [...], sources: [...] }
```

Each section has `id`, `num`, `title`, `sub`, three lists of blocks
(`body` for Technical, `layman`, and `bangla`), and an optional `videos`
list.

A block has a `type`. These are the block types:

| Type        | Purpose                                              |
| ----------- | ---------------------------------------------------- |
| `paragraph` | A paragraph of text.                                 |
| `heading`   | A level 3 or level 4 heading with an `id`.           |
| `list`      | An ordered or unordered list.                        |
| `code`      | A code sample. It stores the source and its highlighted HTML. |
| `diagram`   | An inline SVG with optional captions.                |
| `callout`   | A box with a variant: info, good, warn, danger, or pink. |
| `analogy`   | A box for an analogy.                                |
| `pillGrid`  | A grid of label and value pairs.                     |
| `table`     | A table with headers and rows.                       |
| `panels`    | Side-by-side panels, each with a heading and blocks. |
| `divider`   | A horizontal rule.                                   |
| `html`      | Raw HTML. Use it only when no other type fits.       |

Inline text (`html` fields on paragraphs, headings, list items, and so on)
allows only these tags: `strong`, `em`, `code`, `br`, `a` (a citation link
`<a class="cite" href="#srcN">` or an `http(s)` link). The schema rejects
any other tag.

`src/lib/topics.ts` loads and validates the 13 files, and it exposes the
parts in order. Only server code imports it. Client components get data as
props.

Only these components render raw HTML: `Inline.tsx`, `CodeBlock.tsx`,
`Diagram.tsx`, and `RawHtml.tsx`.

## Videos

Each section can list YouTube videos in `videos`:

```json
{ "id": "zduSFxRajkE", "title": "Let's build the GPT Tokenizer", "channel": "Andrej Karpathy", "lang": "en" }
```

- `id` is the 11-character YouTube video ID. `lang` is `en` or `bn`.
- Copy `title` and `channel` from YouTube's oEmbed answer:
  `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=<id>`.
  A 200 answer also confirms that the video is public and allows embedding.
- Technical and Layman's show the English videos. বাংলা shows the Bangla
  videos first, then the English ones. All three shows all of them.
- A card loads nothing from YouTube until the reader clicks it. Then it
  plays in place through `youtube-nocookie.com`.

The cards are `src/components/content/VideoList.tsx` and `VideoCard.tsx`.
The voice rule is `src/lib/videos.ts`.

## Search

Press Ctrl+K (Cmd+K on macOS) to open the search palette.

1. At build time, `src/app/search-index.json/route.ts` makes one search
   document for each section. The text comes from the Technical voice.
2. On the first open, the palette fetches `search-index.json` under the
   base path.
3. The palette builds a MiniSearch index in the browser and searches as you
   type.
4. A result links to the section, for example `/topics/inference#<id>`.

The shared helpers are in `src/lib/search.ts`.

## Source quality

All citations resolve to:

- **arXiv papers** for the foundational techniques (BPE, SentencePiece, CoT,
  ReAct, Reflexion, MemGPT, LLMLingua, Lost-in-the-Middle, and others).
- **Vendor documentation** for production patterns (Anthropic prompt
  caching, OpenAI prompt caching, Gemini caching, OpenAI Structured Outputs,
  Anthropic tool use).
- **Anthropic engineering blog** for the context-engineering playbook.

## File layout

```
.
├── src/
│   ├── app/
│   │   ├── layout.tsx                  root layout: fonts, header, sidebar, footer
│   │   ├── page.tsx                    landing page (index of 13 parts)
│   │   ├── not-found.tsx               404
│   │   ├── globals.css                 design tokens and prose styles
│   │   ├── search-index.json/route.ts  search index (static)
│   │   └── topics/[slug]/page.tsx      topic page (one per slug, prerendered)
│   ├── components/
│   │   ├── content/                    topic header, sections, voice switcher,
│   │   │   └── blocks/                 sources, prev/next, one file per block type
│   │   ├── layout/                     site header, sidebar, mobile nav
│   │   └── navigation/                 search palette, outline (TOC)
│   ├── content/                        13 topic JSON files (source of truth)
│   └── lib/
│       ├── content-schema.ts           block types and Zod schema
│       ├── topics.ts                   loads and validates content; order, outline, nav
│       └── search.ts                   search index helpers
├── tests/                              content-schema and search tests
├── docs/                               design spec and plan
├── .github/workflows/deploy-pages.yml  GitHub Pages deploy
├── next.config.ts                      static export and base path
└── LICENSE
```

## Design notes

- The site has a dark theme only. Design tokens are CSS variables in
  `globals.css`. Each extra voice has its own color: Layman's is violet,
  বাংলা is green.
- Fraunces (headings), Inter, JetBrains Mono, and Noto Sans Bengali load
  through `next/font/google` with `display: swap`.
- The sidebar lists the 13 parts. Below the `lg` breakpoint, a menu button
  opens the same list.
- The voice switcher works for one section at a time. Its options are
  Technical, Layman's, বাংলা, and All three. A section shows only the
  voices that have content.
- Topic pages show an outline (TOC) on wide screens. It uses
  `IntersectionObserver` to mark the section in view. Heading links in the
  outline work in every voice.
- Content is static. `next build` writes every route to `out/` as HTML.

## License

[MIT](LICENSE)
