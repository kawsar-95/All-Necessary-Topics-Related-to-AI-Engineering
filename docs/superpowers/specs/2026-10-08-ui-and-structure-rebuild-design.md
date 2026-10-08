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
