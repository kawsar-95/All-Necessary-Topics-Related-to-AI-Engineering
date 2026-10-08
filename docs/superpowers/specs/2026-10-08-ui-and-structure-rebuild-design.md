# UI and structure rebuild — design

Date: 2026-10-08
Status: approved for implementation planning

## Goal

Rebuild the reader-facing UI and the internal code structure of the AI
Engineering reference site. The current site works, but the reader finds
navigation hard to use, the visual design looks generic, and the content
rendering relies on raw HTML strings rendered through
`dangerouslySetInnerHTML`.

## Scope

In scope:
- A new content block model for `src/content/*.json` (no more raw HTML
  strings in `body`/`layman`/`bangla`).
- A migration script that converts the 13 existing content files to the
  new model.
- A new navigation shell: sidebar, search, table of contents (TOC), and
  voice switcher.
- A new editorial visual design (typography, landing page, reading
  column).
- A reorganized `src/components/` and `src/lib/` structure.

Out of scope (explicitly deferred):
- A light theme or theme toggle. The site stays dark-theme-only.
- A margin-note ("sidenote") layout for the Layman's/Bangla voices. The
  voice switcher stays a toggle control in this rebuild.
- Any change to the route structure (`/guides/[slug]`, `/topics/[slug]`)
  or to guide/chapter slugs.
- A new automated test framework. The repo has no test suite today; this
  rebuild does not add one.

## Constraints

- Keep the three-voice concept (Technical / Layman's / Bangla) as the
  core content feature.
- Keep `src/content/*.json` as the source of truth for content, under
  one file per guide/chapter, with the same filenames and slugs.
- Keep the current routes stable.
- These three constraints are defaults, not hard locks. If the
  implementation finds a concrete reason to deviate, flag it before
  making the change.

## Content model

### Current model

Each `Section` stores `body`, `layman`, and `bangla` as raw HTML
strings, rendered with `dangerouslySetInnerHTML`. The HTML encodes
paragraphs, headings, code blocks with hand-colored `<span>` tags,
inline SVG diagrams, callouts, pill grids, and tables.

### New model

Each `Section` stores `body`, `layman`, and `bangla` as an array of
typed blocks:

```ts
type InlineHTML = string;
// Constrained to: <strong>, <em>, <code>, and
// <a class="cite" href="#source-N">.

type Block =
  | { type: "paragraph"; html: InlineHTML }
  | { type: "heading"; level: 3 | 4; html: InlineHTML }
  | { type: "list"; ordered: boolean; items: InlineHTML[] }
  | { type: "code"; lang: string; html: string }
  | { type: "diagram"; svg: string; caption?: InlineHTML }
  | { type: "callout"; variant: "info" | "warn" | "danger"; html: InlineHTML }
  | { type: "pillGrid"; items: { label: string; value: string }[] }
  | { type: "table"; headers: string[]; rows: InlineHTML[][] };

type Section = {
  id: string;
  num: string;
  title: string;
  sub: InlineHTML;
  body: Block[];
  layman: Block[];
  bangla: Block[];
};
```

Rules for each block type:

- **paragraph / heading / list items / table cells**: inline HTML stays
  a string, limited to the four allowed tags above. A paragraph does not
  become a nested token array; that scope stays out of this rebuild.
- **code**: the migration script re-highlights the raw code text with
  Shiki. The stored `html` field is Shiki's output, not the old hand-
  colored spans.
- **diagram**: the raw `<svg>` markup carries over unchanged from the
  current content. This rebuild does not redraw diagrams as data-driven
  components.
- **callout / pillGrid / table**: structured fields replace the current
  ad hoc HTML wrappers for these.

`guide.lede` (the homepage summary paragraph) becomes a single
`InlineHTML` string, using the same four-tag allowlist as a paragraph.

### Migration script

`scripts/migrate-content.ts` is a one-time script, not part of the
production build:

1. Load each of the 13 files in `src/content/*.json`.
2. Parse the existing `body`/`layman`/`bangla` HTML with an HTML parser
   (for example `node-html-parser`).
3. Walk the top-level child elements and classify each one into a
   `Block`.
4. For each code block, extract the raw text and language, then run it
   through Shiki to produce the new `html` field.
5. Write the converted JSON back to the same file, with the same
   filename and slug.

After migration, `src/lib/content-schema.ts` defines a Zod schema for
`Block` and `Section`. The build validates every content file against
this schema. A file that does not match the schema fails the build,
instead of rendering silently wrong.

### Inline HTML and safety

The inline HTML allowlist (`<strong>`, `<em>`, `<code>`, citation links)
is still rendered with `dangerouslySetInnerHTML`, but only for that
short string, not for a whole section. All content comes from the
project's own files, not from a reader or an external source, so this
carries the same trust level as the rest of the static site. The Zod
schema validation at build time is the safety net: it can check the
inline string against the allowlist with a regex and fail the build on
a mismatch.

## Navigation shell

### Sidebar

A persistent left sidebar replaces the current top-bar-only navigation.
It lists all guides and chapters as a tree, with the current page
highlighted. On small screens, it collapses behind a toggle. The header
shrinks to the site logo and a search trigger.

### Search

A `Cmd+K` command palette searches across all guides, chapters, and
sections. `src/lib/search-index.ts` builds a search index at build time
from section titles, `sub` text, and the plain text of each block
(inline HTML tags stripped). The palette uses `minisearch` (about 9 KB)
for fuzzy ranking.

### Table of contents (TOC)

The existing sticky right-side TOC keeps its current behavior: an
`IntersectionObserver` highlights the section in view, and a click
smooth-scrolls to it. Only its visual style changes, to match the new
editorial design.

### Voice switcher

The Technical / Layman's / Bangla / All toggle keeps its current
interaction model: one voice shown at a time, or all three stacked. Its
visual style changes to a segmented control with a cross-fade
transition between voices.

## Visual design

- **Typography**: a display serif font (for example Fraunces) for
  headlines, paired with the current Inter for body text and JetBrains
  Mono for code. Noto Sans Bengali stays for the Bangla voice.
- **Landing page**: the guide list moves from boxed cards to an
  editorial index — a masthead-style hero, then guides as a numbered
  table-of-contents list.
- **Reading column**: the content column narrows to an editorial
  measure (about 680px), replacing the current generic `max-w-4xl`
  container.
- **Theme**: the site stays dark-theme-only. The color tokens in
  `globals.css` may shift in shade to fit the new design, but the
  dark-first identity stays.

## File and component structure

```
src/
  app/
    layout.tsx, page.tsx, not-found.tsx, globals.css
    guides/[slug]/page.tsx
    topics/[slug]/page.tsx
  components/
    layout/
      SiteHeader.tsx
      Sidebar.tsx
      MobileNav.tsx
    content/
      ProseBlocks.tsx
      blocks/
        Paragraph.tsx
        Heading.tsx
        CodeBlock.tsx
        Diagram.tsx
        Callout.tsx
        PillGrid.tsx
        Table.tsx
        ListBlock.tsx
      VoiceSwitcher.tsx
      SectionView.tsx
    navigation/
      SectionNav.tsx
      SearchPalette.tsx
    Sources.tsx
  content/
    *.json            (same 13 files, new Block schema)
  lib/
    guides.ts          (typed accessors, largely unchanged)
    content-schema.ts   (Zod schema + Block types)
    search-index.ts     (build-time index generator)
scripts/
  migrate-content.ts    (one-time migration, not shipped)
```

`ProseBlocks` takes a `Block[]` and renders each block with its matching
component from `components/content/blocks/`. `SectionView` calls
`ProseBlocks` once per active voice, instead of three raw
`dangerouslySetInnerHTML` calls.

## Testing and validation

The repo has no test suite today, and this rebuild does not add one.
Validation has two parts:

1. **Automated**: the Zod schema check at build time, which fails the
   build on any content file that does not match the `Block` schema.
2. **Manual**: after migration, view all 4 full guides and at least 2
   chapters in `npm run dev`. Check that diagrams, code blocks,
   callouts, tables, and both voice-switcher states render correctly.

## Open questions

None. All prior open points (approach A vs. B, code-block handling,
diagram handling, sidebar vs. docs-site look) were resolved during
design and are recorded as decisions above.

## Amendment 1 (2026-10-08): 13-part order and planning findings

This amendment overrides earlier sections where they conflict.

### One ordered list of 13 topics

The user gave a fixed order of 13 parts. The site drops the split
between 4 "guides" and 9 "chapters". All 13 are "topics", numbered
Part 1 to Part 13 in this order:

| Part | Title | Tagline | Slug (new) | Old file |
|---|---|---|---|---|
| 1 | LLM Fundamentals | from an engineer's lens | `llm-fundamentals` | `llm-fundamentals.json` |
| 2 | Prompt Engineering | — | `prompt-engineering` | `prompt-engineering.json` |
| 3 | Context Engineering | the new "prompt engineering" | `context-engineering` | `context-engineering.json` |
| 4 | RAG and Knowledge Systems | — | `rag-knowledge-systems` | `rag-knowledge-systems.json` |
| 5 | Agents and Agentic Systems | — | `agents-and-agentic-systems` | `01-agents-and-agentic-systems.json` |
| 6 | Tool Use and Integrations | — | `tool-use-and-integrations` | `02-tool-use-and-integrations.json` |
| 7 | Inference | — | `inference` | `03-inference.json` |
| 8 | LLMOps and Observability | — | `llmops-and-observability` | `04-llmops-and-observability.json` |
| 9 | Evaluation Engineering | — | `evaluation-engineering` | `05-evaluation-engineering.json` |
| 10 | Cost and Performance Optimization | — | `cost-and-performance-optimization` | `06-cost-and-performance-optimization.json` |
| 11 | Safety, Security, and Guardrails | — | `safety-security-and-guardrails` | `07-safety-security-and-guardrails.json` |
| 12 | Multimodal Engineering | — | `multimodal-engineering` | `08-multimodal-engineering.json` |
| 13 | AI Application Architecture | — | `ai-application-architecture` | `09-ai-application-architecture.json` |

Consequences:

- **Routes**: every topic lives at `/topics/<slug>`. The old URLs
  redirect permanently: `/guides/<slug>` goes to `/topics/<slug>`, and
  `/topics/0N-<slug>` goes to `/topics/<slug>`. No old link breaks.
- **Files**: content files are renamed to `src/content/<slug>.json`.
  The order lives in one array in `src/lib/topics.ts`, not in file
  names.
- **RAG section order**: Part 4 moves "GraphRAG" (`s6`) after
  "Metadata filtering" (`s8`), to match the given order. Section ids
  stay the same; section numbers are renumbered.
- **Single-section topics**: Parts 6 to 13 each hold one section, with
  the subtopics as `h3` headings. For a topic with one section, the TOC
  and the landing page list its `h3` headings, so the reader sees the
  subtopics from the given list.
- **Prev/next links** run across all 13 parts.

### Findings from the content survey

The survey of the 13 files found these facts. The plan handles each:

- Callouts use 5 variants: `info` (no modifier), `good`, `warn`,
  `danger`, `pink`.
- Two more block shapes exist: `.two-col` with `.panel` children
  (heading + text), and `<hr>` dividers. The `.analogy` box closes most
  Layman's and Bangla parts.
- Callouts can contain nested blocks (lists, code, tables), so
  callouts, analogies, and panels hold `Block[]`, not one string.
- Layman's and Bangla parts start with a `.layman-head` or
  `.bangla-head` div (icon + label). The migration drops it. The UI
  shows the label instead.
- Some prose uses `<br>`. The inline allowlist adds `<br>`.
- Some text contains pseudo-tags such as `<document>` without escaping.
  Today the browser swallows them, so readers do not see them. The
  migration escapes them, so they show as literal text.
- Code blocks have no language marker. The migration detects the
  language with fixed rules plus a manual override map.
- `heroTitle` is an empty string in all 13 files. The migration drops
  it. Pages use `title` as the headline.
- Inline `style` attributes on lists and code blocks are dropped.
- The Bangla font rule names "Noto Sans Bengali" directly, which does
  not match the `next/font` family. The rebuild uses the
  `--font-bengali` variable.

### Block model, final

```ts
type Inline = string;
// Allowed tags: <strong>, <em>, <code>, <br>,
// <a class="cite" href="#srcN">, <a href="https://...">.
type CalloutVariant = "info" | "good" | "warn" | "danger" | "pink";

type Block =
  | { type: "paragraph"; html: Inline }
  | { type: "heading"; level: 3 | 4; id: string; html: Inline }
  | { type: "list"; ordered: boolean; items: Inline[] }
  | { type: "code"; lang: string; code: string; html: string }
  | { type: "diagram"; svg: string; caption?: Inline; captionBn?: Inline }
  | { type: "callout"; variant: CalloutVariant; blocks: Block[] }
  | { type: "analogy"; blocks: Block[] }
  | { type: "pillGrid"; items: { label: Inline; value: Inline }[] }
  | { type: "table"; headers: Inline[]; rows: Inline[][] }
  | { type: "panels"; panels: { heading: Inline; blocks: Block[] }[] }
  | { type: "divider" }
  | { type: "html"; html: string };
```

The `html` block is a fallback for markup the migration does not
recognize. The migration report lists each one. The target is zero.

A topic file has this shape: `{ slug, title, tagline?, lede, sections,
sources }`. The fields `heroTitle`, `isChapter`, and the old chapter
`num` are removed.

### Tests

The repo still gets no test framework. The migration code, the schema,
and the search helper get unit tests with Node's built-in `node:test`
runner (`npm test`). Node 26 runs the `.ts` test files directly. The
migration code, its tests, and the legacy content are deleted at the
end, after the converted content is committed.
