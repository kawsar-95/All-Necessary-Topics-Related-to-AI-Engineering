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
(`body` for Technical, `layman`, and `bangla`), an optional `videos`
list, and an optional `practice` list.

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

## Practice

Each section has a "Practice" panel with guided tasks. A reader does them
in any free AI chat (ChatGPT, Claude, or Gemini). No install, code, or API
key is necessary. In a part with several sections, each section has 1
task. A part with only 1 big section has 4 tasks.

Each task has an English and a Bangla version. The বাংলা voice shows the
Bangla version. The other voices show the English version. The Bangla
version keeps English technical words (prompt, token, model, and so on).

A task is one entry in the section's `practice` list:

```json
{
  "en": {
    "title": "See why the AI gives different answers",
    "why": "A chatbot can give a different answer to the same question.",
    "steps": [
      {
        "chat": "new",
        "do": "Copy this prompt, paste it, and press Enter.",
        "prompt": "Complete this sentence with one word only: Once upon a time, there was a little",
        "expect": "One word, for example <em>girl</em>.",
        "example": "girl"
      },
      { "chat": "new", "do": "Do step 1 two more times, each in a new chat.", "expect": "Often a different word." }
    ],
    "learned": "The AI picks each word partly by chance.",
    "done": "You have 3 story words.",
    "check": { "question": "Why does the word change?", "answer": "..." },
    "challenge": "Ask for the most common word. What changes?"
  },
  "bn": { "...": "the same fields, in Bangla" }
}
```

| Field | Shown as |
|---|---|
| `why` | Why this matters |
| `steps[].chat` | A NEW CHAT or SAME CHAT label. The first step is always `new`. |
| `steps[].do` | What to do in this step |
| `steps[].prompt` | A box with a Copy button, inside the step |
| `steps[].expect` | You should see: |
| `steps[].example` | Example answer, hidden until the reader opens it |
| `learned` | What just happened |
| `done` | You are done when |
| `check` | Check yourself, with a hidden answer |
| `challenge` | Try a harder version |

- `title`, `prompt`, and `example` are plain text. The other text fields
  allow the inline tags.
- A prompt must hold all the material that the task needs.
- The panel shows the chat links and a "How practice works" box one time,
  above the tasks. Do not repeat that text in a task.
- The schema checks that both versions exist and that the first step opens
  a new chat.

The panel is `src/components/content/PracticeList.tsx` and `CopyButton.tsx`.
The voice-to-language rule is `src/lib/practice.ts`.

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
│   │   ├── layout/                     site header, sidebar, mobile nav, theme switch
│   │   └── navigation/                 search palette, outline (TOC)
│   ├── content/                        13 topic JSON files (source of truth)
│   └── lib/
│       ├── content-schema.ts           block types and Zod schema
│       ├── topics.ts                   loads and validates content; order, outline, nav
│       ├── search.ts                   search index helpers
│       ├── videos.ts                   which videos each voice shows
│       ├── practice.ts                 which practice language each voice shows
│       └── theme.ts                    theme choice and the inline head script
├── tests/                              content-schema, search, video, practice, and theme tests
├── docs/                               design spec and plan
├── .github/workflows/deploy-pages.yml  GitHub Pages deploy
├── next.config.ts                      static export and base path
└── LICENSE
```

## Design notes

- The site has a light and a dark theme. Design tokens are CSS variables in
  `globals.css`, one set for each theme. Each extra voice has its own color:
  Layman's is violet, বাংলা is green. Every text color has 4.5:1 contrast
  or more on the page and card backgrounds.
- The sun/moon button in the header switches the theme. On the first visit
  the site follows the device setting. After a click, `localStorage`
  (key `theme`) keeps the choice. An inline script in `<head>`
  (`THEME_INIT_SCRIPT` in `src/lib/theme.ts`) sets `data-theme` on `<html>`
  before the first paint, so the page does not flash. Without JavaScript
  the site shows the dark theme.
- Code blocks stay dark in both themes. Their Shiki colors are inline in
  the content HTML.
- Diagram SVGs use fixed colors made for a dark ground. In the light
  theme, `globals.css` maps each solid diagram color to a darker or lighter
  one. If you add a diagram with a new solid color, add it to that map.
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
