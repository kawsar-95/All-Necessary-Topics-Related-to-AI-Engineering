# UI and Structure Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the 13 content files to a typed block model, put them in one 13-part order, and rebuild the site as an editorial reader with a sidebar, search, TOC, and voice switcher.

**Architecture:** A one-time migration script (`scripts/`) parses the legacy HTML strings into typed `Block[]`, highlights code with Shiki, and writes `src/content/<slug>.json`. `src/lib/topics.ts` loads and Zod-validates the 13 files at build time, in the fixed order. React components render each block type; the only remaining `dangerouslySetInnerHTML` targets are allowlisted inline strings, Shiki output, and diagram SVGs.

**Tech Stack:** Next.js 16.4 (App Router, `cacheComponents: true`), React 19.3, TypeScript 5, Tailwind CSS 4, Zod, MiniSearch, Shiki and node-html-parser (migration only), `node:test` on Node 26.

**Spec:** `docs/superpowers/specs/2026-10-08-ui-and-structure-rebuild-design.md` (read Amendment 1 first; it overrides the earlier sections).

## Global Constraints

- Before you use any Next.js API, read its page in `node_modules/next/dist/docs/`. This is Next 16; APIs differ from older versions.
- `cacheComponents: true` is on. Wrap every client component that calls `usePathname` in `<Suspense>` with a fallback (see `01-app/03-api-reference/04-functions/use-pathname.md`).
- Tests run with `node --test` on Node 26 type stripping. In any file a test or script imports: no `enum`, no `namespace`, no constructor parameter properties, relative imports with the `.ts` extension, no `@/` alias, `import type` for type-only imports.
- New dependencies, exactly: `zod`, `minisearch` (dependencies); `node-html-parser`, `shiki` (devDependencies, removed in Task 11). No other packages, no test framework.
- Never import `src/lib/topics.ts` from a `"use client"` file. Pass the data as props.
- Inline allowlist: `<strong>`, `<em>`, `<code>`, `<br>`, `<a class="cite" href="#srcN">`, `<a href="https://…">` (or `http://`). No other tags, no other attributes.
- Callout variants: `info | good | warn | danger | pink`.
- Shiki theme: `github-dark-dimmed`.
- Routes: `/` and `/topics/[slug]` only. Redirects keep `/guides/<slug>` and `/topics/0N-<slug>` working.
- Dark theme only. Fonts: Fraunces (display, `--font-display`), Inter (body, `--font-inter`), JetBrains Mono (code, `--font-mono-jb`), Noto Sans Bengali (`--font-bengali`).
- Reading column: `max-w-[680px]`.
- Voice labels (exact copy): `Technical`, `Layman's`, `বাংলা`, `All three`. Panel headers: `Layman's version` / `plain English, no jargon`; `বাংলা ব্যাখ্যা` / `সহজ ভাষায় বিস্তারিত`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Pseudo-tags in text** (`<document>`, `<thinking>`, `<the user's question>`): readers must see them as literal text, in prose and in code. Pinned by tests in Tasks 2 and 4.
2. **Ctrl+K on Linux**: the user is on Linux. The palette must open on Ctrl+K as well as Cmd+K, and close on Escape. Manual check in Task 8.
3. **Unknown slug** (`/topics/nope`, `/guides/nope`): must show the 404 page, and the sidebar `Suspense` must not break `next build`. Checked in Task 6 and Task 7 with `curl`.
4. **Phone width (375 px)**: wide tables, code, and diagrams must scroll inside their own box; the page must not scroll sideways; the sidebar must hide behind a toggle. Manual check in Tasks 9 and 11.
5. **Empty search query or a failed index fetch**: the palette shows a hint or an error line, never crashes. Pinned by a `runSearch("")` test in Task 8, plus a manual check.

---

### Task 1: Test harness and content schema

**Files:**
- Modify: `package.json` (add `zod`; add script `"test": "node --test \"tests/**/*.test.ts\""`)
- Modify: `tsconfig.json` (add `"allowImportingTsExtensions": true`)
- Create: `src/lib/content-schema.ts`
- Test: `tests/content-schema.test.ts`

**Interfaces:**
- Produces (all from `src/lib/content-schema.ts`):
  - types `Inline`, `CalloutVariant`, `Block`, `Section`, `Source`, `TopicFile` exactly as in the spec's "Block model, final"; `Section = { id: string; num: string; title: string; sub: Inline; body: Block[]; layman: Block[]; bangla: Block[] }`; `Source = { n: number; url: string; text: string }`; `TopicFile = { slug: string; title: string; tagline?: string; lede: Inline; sections: Section[]; sources: Source[] }`.
  - `isAllowedInline(html: string): boolean`
  - Zod schemas `BlockSchema`, `SectionSchema`, `TopicFileSchema` (`TopicFileSchema.parse` returns `TopicFile`). Every `Inline` field uses `z.string().refine(isAllowedInline)`. `BlockSchema` is recursive (`z.lazy`).

- [ ] **Step 1: Install and configure**

Run: `npm install zod` then edit `package.json` and `tsconfig.json` as listed above.

- [ ] **Step 2: Write the failing tests in `tests/content-schema.test.ts`**

```ts
test("isAllowedInline accepts the allowlist", () => {
  assert.equal(isAllowedInline('a <strong>b</strong> <em>c</em> <code>d</code><br> <a class="cite" href="#src12">[12]</a> <a href="https://arxiv.org/abs/1">x</a>'), true);
});
test("isAllowedInline rejects other tags and attributes", () => {
  for (const bad of ['<div>x</div>', '<span class="kw">x</span>', '<strong style="color:red">x</strong>', '<a href="javascript:alert(1)">x</a>', '<a class="cite" href="#foo">x</a>', '<img src=x>']) {
    assert.equal(isAllowedInline(bad), false, bad);
  }
});
test("isAllowedInline accepts escaped pseudo-tags", () => {
  assert.equal(isAllowedInline("wrap in <code>&lt;document&gt;</code>"), true);
});
test("TopicFileSchema accepts nested callout blocks", () => {
  const file = { slug: "x", title: "X", lede: "L", sources: [], sections: [{ id: "s1", num: "01", title: "T", sub: "", layman: [], bangla: [],
    body: [{ type: "callout", variant: "pink", blocks: [{ type: "list", ordered: false, items: ["a"] }] }] }] };
  assert.deepEqual(TopicFileSchema.parse(file), file);
});
test("TopicFileSchema rejects unknown block types and bad variants", () => {
  const base = { slug: "x", title: "X", lede: "L", sources: [], sections: [{ id: "s1", num: "01", title: "T", sub: "", layman: [], bangla: [], body: [] as unknown[] }] };
  base.sections[0].body = [{ type: "aside", html: "x" }];
  assert.throws(() => TopicFileSchema.parse(base));
  base.sections[0].body = [{ type: "callout", variant: "blue", blocks: [] }];
  assert.throws(() => TopicFileSchema.parse(base));
});
```

- [ ] **Step 3: Run `npm test`.** Expected: FAIL (module `../src/lib/content-schema.ts` not found).

- [ ] **Step 4: Implement `src/lib/content-schema.ts`.** `isAllowedInline` scans every `<…>` tag with one regex and checks each against the allowlist; text between tags is not checked (escaped entities are text). Types come from `z.infer` where that keeps them identical to the spec; otherwise declare them and annotate the schema.

- [ ] **Step 5: Run `npm test` and `npx tsc --noEmit`.** Expected: all pass, no type errors.

- [ ] **Step 6: Commit** — `feat: add typed content block schema and node:test harness`.

---

### Task 2: Migration — pseudo-tag escaping and inline serializer

**Files:**
- Create: `scripts/migrate/escape.ts`, `scripts/migrate/inline.ts`
- Modify: `package.json` (devDependency `node-html-parser`)
- Test: `tests/migrate-inline.test.ts`

**Interfaces:**
- Produces:
  - `escapePseudoTags(html: string): string` (in `escape.ts`)
  - `serializeInline(nodes: Node[]): string` — nodes are `node-html-parser` nodes (in `inline.ts`)
  - `inlineFromHtml(html: string): string` — `escapePseudoTags`, parse, `serializeInline(root.childNodes)`, trim (in `inline.ts`)

**`escapePseudoTags` rule:** outside `<svg>…</svg>` regions, find every `<name …>` or `</name>` where `name` starts with a letter. If the lowercase name is not in `KNOWN_TAGS`, replace that `<` with `&lt;` and that `>` with `&gt;`. Leave `<svg>` regions untouched. `KNOWN_TAGS` = `p h3 h4 ul ol li pre code table thead tbody tr th td hr div span strong em a br small sup sub b i svg`.

**`serializeInline` rules:**

| Node | Output |
|---|---|
| text | its raw text, unchanged (entities stay encoded) |
| `strong`, `em`, `code` | `<tag>` + children + `</tag>`, attributes dropped |
| `br` | `<br>` |
| `a` with class `cite` and `href="#srcN"` | `<a class="cite" href="#srcN">` + children + `</a>` |
| `a` with `href` starting `http://` or `https://` | `<a href="…">` + children + `</a>` |
| `span`, `small`, `sup`, `sub`, `b`, `i`, other `a` | children only (tag unwrapped) |
| any other element | children only, and push a warning (Task 3 passes the warnings array; here, accept an optional `warnings?: string[]`) |

- [ ] **Step 1: Write the failing tests**

```ts
test("escapes pseudo-tags in prose", () => {
  assert.equal(inlineFromHtml("wrap in <code><document>…</document></code> tags"),
    "wrap in <code>&lt;document&gt;…&lt;/document&gt;</code> tags");
});
test("escapes an unclosed pseudo-tag", () => {
  assert.equal(inlineFromHtml("use <code><document></code> here"), "use <code>&lt;document&gt;</code> here");
});
test("escapes pseudo-tags with spaces", () => {
  assert.equal(escapePseudoTags("<the user's question>"), "&lt;the user's question&gt;");
});
test("keeps svg internals", () => {
  const svg = '<svg viewBox="0 0 1 1"><text x="0">a</text><marker id="m"/></svg>';
  assert.equal(escapePseudoTags(svg), svg);
});
test("keeps allowlisted marks and drops attributes", () => {
  assert.equal(inlineFromHtml('<strong style="x">A</strong> <a class="cite" href="#src3">[3]</a> <span class="kw">k</span>'),
    '<strong>A</strong> <a class="cite" href="#src3">[3]</a> k');
});
test("keeps br", () => {
  assert.equal(inlineFromHtml("1. a<br>\n2. b"), "1. a<br>\n2. b");
});
test("output passes isAllowedInline", () => {
  assert.equal(isAllowedInline(inlineFromHtml('x <document>y</document> <a href="https://a.b">l</a>')), true);
});
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL (modules not found).
- [ ] **Step 3: Install `node-html-parser` (dev) and implement both files** to the rule tables above.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** — `feat: add migration inline serializer with pseudo-tag escaping`.

---

### Task 3: Migration — block parser

**Files:**
- Create: `scripts/migrate/blocks.ts`
- Test: `tests/migrate-blocks.test.ts`

**Interfaces:**
- Consumes: `escapePseudoTags`, `serializeInline` (Task 2); `Block` type (Task 1).
- Produces:
  - `type ParseContext = { where: string; warnings: string[]; headingIds: Set<string>; sectionId: string }`
  - `parseBlocks(html: string, ctx: ParseContext): Block[]` — escapes, parses, then calls `parseNodes`.
  - `parseNodes(nodes: Node[], ctx: ParseContext): Block[]` — the recursive worker.
  - `slugify(text: string): string`
  - Code blocks come out as `{ type: "code", lang: "", code, html: "" }`; Task 4 fills `lang` and `html`. `code` = `extractCode(pre)` from Task 4 — to avoid a cycle, put `extractCode` in `scripts/migrate/code-text.ts` in this task and re-export it from `code.ts` in Task 4.

**`extractCode(preInnerHtml: string): string`:** take the inner HTML of the `<code>` element (or of `<pre>` if no `<code>`), remove every `<span …>` and `</span>`, then decode `&lt; &gt; &quot; &#39; &amp;` (decode `&amp;` last). Trim one leading and one trailing newline only.

**`parseNodes` rules, per child node in order:**

| Node | Block |
|---|---|
| whitespace-only text | skipped |
| text, or an inline element (`strong em code a br span small sup sub b i`, or an unknown tag) | appended to the current inline run |
| `p` | `paragraph` with `serializeInline(children)`; empty result skipped |
| `h3`, `h4` | `heading` with `level` 3/4, `html`, `id` (below) |
| `ul`, `ol` | `list`; each `li` → `serializeInline(li.childNodes)` |
| `pre` | `code` (see above) |
| `table` | `table`; `headers` = `th` cells of the first row that has `th`; `rows` = every other `tr` → its `td` cells, each via `serializeInline` |
| `hr` | `divider` |
| `div.diagram` | `diagram`; `svg` = the `<svg>` outer HTML; `caption` = inline of `.diagram-caption` without `.diagram-caption-bn`; `captionBn` = inline of `.diagram-caption-bn`; omit absent captions |
| `div.callout` | `callout`; `variant` = first of `good warn danger pink` in the class list, else `info`; `blocks` = `parseNodes(children)` |
| `div.analogy` | `analogy`; `blocks` = `parseNodes(children)` |
| `div.pill-grid` | `pillGrid`; each `.pill` → `{ label: inline(.label), value: inline(.val) }` |
| `div.two-col` | `panels`; each `.panel` → `{ heading: inline(first h4), blocks: parseNodes(other children) }` |
| `div.layman-head`, `div.bangla-head` | skipped |
| `li` containing `ul ol pre table div`, or any other element | `html` block with the outer HTML, and push `"<ctx.where>: fallback <tag.class>"` to `ctx.warnings` |

Before each non-inline block, and at the end, flush a non-empty inline run as one `paragraph` (trimmed).

**Heading `id`:** `slugify(text)` = lowercase, strip tags, replace runs of non `[a-z0-9]` with `-`, trim `-`, cut to 60 chars. `id` = `` `${ctx.sectionId}-${slug}` ``, or `` `${ctx.sectionId}-h${n}` `` (n = 1-based count of headings in this context) when the slug is empty. If `ctx.headingIds` has it, append `-2`, `-3`, …; then add it to the set.

- [ ] **Step 1: Write the failing tests** — one test per row of the rule table, plus:

```ts
test("groups a bare inline run inside a callout into one paragraph", () => {
  const b = parseBlocks('<div class="callout good"><strong>Rule:</strong> text <em>x</em><ul><li>a</li></ul></div>', ctx());
  assert.deepEqual(b, [{ type: "callout", variant: "good", blocks: [
    { type: "paragraph", html: "<strong>Rule:</strong> text <em>x</em>" },
    { type: "list", ordered: false, items: ["a"] } ] }]);
});
test("drops the layman head", () => {
  const b = parseBlocks('<div class="layman-head"><span class="icon">🤖</span><span class="label">L<small>s</small></span></div><p>Hi</p>', ctx());
  assert.deepEqual(b, [{ type: "paragraph", html: "Hi" }]);
});
test("heading ids are unique per context", () => {
  const c = ctx("s2");
  const b = parseBlocks("<h3>Frameworks</h3><h3>Frameworks</h3><h3>বাংলা</h3>", c);
  assert.deepEqual(b.map(x => (x as { id: string }).id), ["s2-frameworks", "s2-frameworks-2", "s2-h3"]);
});
test("unknown div becomes an html block with a warning", () => {
  const c = ctx();
  const b = parseBlocks('<div class="mystery">x</div>', c);
  assert.equal(b[0].type, "html");
  assert.equal(c.warnings.length, 1);
});
test("extractCode keeps pseudo-tags and strips highlight spans", () => {
  assert.equal(extractCode('<span class="kw">def</span> f(): return <span class="str">"&lt;document&gt;"</span>'), 'def f(): return "<document>"');
});
```

Use a `ctx(sectionId = "s1")` helper that returns a fresh `ParseContext`.

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement `scripts/migrate/blocks.ts` and `scripts/migrate/code-text.ts`.**
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** — `feat: add migration block parser`.

---

### Task 4: Migration — code language and Shiki highlighting

**Files:**
- Create: `scripts/migrate/code.ts`
- Modify: `package.json` (devDependency `shiki`)
- Test: `tests/migrate-code.test.ts`

**Interfaces:**
- Consumes: `Block` (Task 1); `extractCode` (Task 3).
- Produces:
  - `type Lang = "python" | "sql" | "json" | "bash" | "xml" | "text"`
  - `detectLang(code: string): Lang`
  - `type Highlight = (code: string, lang: string) => string`
  - `createHighlight(): Promise<Highlight>` — Shiki `createHighlighter({ themes: ["github-dark-dimmed"], langs: ["python","sql","json","bash","xml"] })`; returns `(code, lang) => hl.codeToHtml(code, { lang, theme: "github-dark-dimmed" })`; `lang "text"` maps to Shiki's `"text"`.
  - `highlightBlocks(blocks: Block[], highlight: Highlight, langFor: (code: string, index: number) => Lang): Block[]` — returns new blocks; every `code` block, at any depth (inside `callout`, `analogy`, `panels`), gets `lang = langFor(code, i)` and `html = highlight(code, lang)`; `i` counts code blocks in document order from 0.

**`detectLang` rules, first match wins:**
1. first non-empty line starts with `--` → `sql`
2. trimmed code starts with `{` or `[` and `JSON.parse` succeeds → `json`
3. first non-empty line starts with `$ ` → `bash`
4. any line matches `/^\s*(def|class|import|from|async def|return|for|if|with)\b/` → `python`
5. first non-empty line starts with `<` → `xml`
6. otherwise → `text`

- [ ] **Step 1: Write the failing tests**

```ts
test("detectLang", () => {
  assert.equal(detectLang("-- pgvector\nCREATE INDEX"), "sql");
  assert.equal(detectLang('{"a": 1}'), "json");
  assert.equal(detectLang("# The minimal agent\ndef agent_loop():\n  pass"), "python");
  assert.equal(detectLang("<system>\nrules\n</system>"), "xml");
  assert.equal(detectLang("Thought: x\nAction: y"), "text");
});
test("highlightBlocks fills nested code blocks in order", () => {
  const seen: string[] = [];
  const out = highlightBlocks([
    { type: "code", lang: "", code: "a", html: "" },
    { type: "callout", variant: "info", blocks: [{ type: "code", lang: "", code: "b", html: "" }] },
  ], (c, l) => `<pre>${c}:${l}</pre>`, (c, i) => { seen.push(`${c}${i}`); return "text"; });
  assert.deepEqual(seen, ["a0", "b1"]);
  assert.equal((out[1] as any).blocks[0].html, "<pre>b:text</pre>");
});
test("shiki output keeps a literal pseudo-tag visible", async () => {
  const hl = await createHighlight();
  const html = hl('x = "<document>"', "python");
  assert.match(html, /&lt;document&gt;|&#x3C;document>/);
});
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Install `shiki` (dev) and implement `scripts/migrate/code.ts`** (re-export `extractCode`).
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** — `feat: add code language detection and Shiki highlighting for migration`.

---

### Task 5: Block renderer components (not wired yet)

**Files:**
- Create: `src/components/content/ProseBlocks.tsx`, `src/components/content/Inline.tsx`, and `src/components/content/blocks/{Paragraph,Heading,ListBlock,CodeBlock,Diagram,Callout,Analogy,PillGrid,Table,Panels,Divider,RawHtml}.tsx`
- Modify: `src/app/globals.css` (add the `.prose-inline` and `.shiki` rules below; do not remove old rules yet)

**Interfaces:**
- Consumes: `Block`, `Inline` types (Task 1).
- Produces:
  - `ProseBlocks({ blocks }: { blocks: Block[] })` — server component; maps `block.type` to its component; an exhaustive `switch` with a `never` check.
  - `Inline({ html, as = "span", className }: { html: string; as?: "span" | "p" | "div" | "li" | "td" | "th" | "h3" | "h4"; className?: string })` — the one place that renders an `Inline` string with `dangerouslySetInnerHTML`.
  - Each block component takes the block itself as its props (for example `Callout(block: Extract<Block, { type: "callout" }>)`). Container blocks (`Callout`, `Analogy`, `Panels`) render children with `ProseBlocks`.

**Rendering decisions:**
- `Heading`: element `h3`/`h4` with `id={block.id}` and `scroll-mt-24`.
- `CodeBlock`: `<div className="code-block">` with Shiki HTML inside; the wrapper scrolls on x; a small top-right label shows `block.lang` unless it is `text`.
- `Diagram`: `<figure>` with the SVG (`dangerouslySetInnerHTML`), `figcaption` for `caption`, a second muted `figcaption lang="bn"` for `captionBn`; the SVG box scrolls on x on narrow screens.
- `Callout`: left rule plus tinted background; color from variant: `info` → `--accent`, `good` → `--good`, `warn` → `--warn`, `danger` → `--danger`, `pink` → `--pink`.
- `Analogy`: inset box with a left rule in the current voice color (CSS variable `--voice`, set by the voice panel in Task 9; default `--accent`).
- `Table`: wrapper with `overflow-x-auto`.
- `Panels`: `grid gap-4 sm:grid-cols-2`.
- `RawHtml`: renders the string as-is inside a `div` with `data-fallback`; no special styles.
- `.prose-inline` CSS styles `strong`, `em`, `code` (inline), `a`, `a.cite` (superscript badge) — port the look from today's `.prose-guide` rules with the new tokens from Task 7 (use today's tokens for now).

- [ ] **Step 1: Implement the components and CSS.**
- [ ] **Step 2: Run `npx tsc --noEmit` and `npm run lint`.** Expected: no errors.
- [ ] **Step 3: Run `npm run build`.** Expected: success (the old pages are still in use).
- [ ] **Step 4: Commit** — `feat: add block renderer components`.

---

### Task 6: Run the migration, unify topics, switch the app over

**Files:**
- Move: `src/content/*.json` → `scripts/legacy-content/` (`git mv`, same names)
- Create: `scripts/migrate-content.ts`, `src/lib/topics.ts`, `src/app/topics/[slug]/page.tsx` (rewrite), `src/components/content/SectionView.tsx`
- Create (output): `src/content/<slug>.json` × 13 (names from the spec's Part table)
- Modify: `next.config.ts` (redirects), `src/app/page.tsx`, `src/components/SiteHeader.tsx`, `src/app/not-found.tsx` (switch imports to `topics.ts`; keep their current look — Tasks 7–10 restyle)
- Delete: `src/lib/guides.ts`, `src/app/guides/`, `src/components/SectionView.tsx`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces (from `src/lib/topics.ts`):
  - `TOPIC_ORDER: readonly string[]` — the 13 slugs in Part order.
  - `type Topic = TopicFile & { part: number }`
  - `TOPICS: Topic[]` — each file passed through `TopicFileSchema.parse` at module load, so bad content fails `next build`.
  - `getTopic(slug: string): Topic | undefined`
  - `getNeighbors(slug: string): { prev?: Topic; next?: Topic }`
  - `type OutlineItem = { id: string; title: string; level: 2 | 3 }`
  - `getOutline(topic: Topic): OutlineItem[]` — every section at level 2 (`title` = section title); if the topic has exactly one section, also its `body` headings with `level === 3`, at level 3 (title = heading text with tags stripped).
  - `type NavItem = { part: number; slug: string; title: string }`; `getNavItems(): NavItem[]`
  - `stripTags(html: string): string` — removes tags and decodes `&lt; &gt; &quot; &#39; &amp;`.
  - `SectionView({ section }: { section: Section })` — client component; for now keeps today's 4-button voice picker but renders each voice with `ProseBlocks` (Task 9 replaces the picker).

**`scripts/migrate-content.ts` behavior:**
1. A `PARTS` array holds, per Part: old file name, new slug, title, optional tagline (copy every value from the spec's Part table).
2. For each part: read `scripts/legacy-content/<old>.json`; build `sub` and `lede` with `inlineFromHtml`; build `body`, `layman`, `bangla` with `parseBlocks` (`where` = `` `${old}#${section.id}#${voice}` ``; one `headingIds` set per file); then `highlightBlocks` with `langFor = (code, i) => CODE_LANG_OVERRIDES[`${where}#${i}`] ?? detectLang(code)`.
3. For `rag-knowledge-systems`, reorder sections to `s1 s2 s3 s4 s5 s7 s8 s6 s9 s10`. For every file, renumber `num` as `"01"`, `"02"`, … in final order.
4. Output `{ slug, title, tagline?, lede, sections, sources }` (drop `heroTitle`, `isChapter`, top-level `num`), `TopicFileSchema.parse` it, write `src/content/<slug>.json` with 2-space indent.
5. Print a report: per file, block counts by type; every warning; a table of every code block (`where#i`, first line, chosen lang); the count of `html` fallback blocks.

**Redirects (`next.config.ts`, read `05-config/01-next-config-js/redirects.md` first):** `/guides/:slug` → `/topics/:slug`, permanent; and one explicit permanent entry per old chapter slug, `/topics/0N-<slug>` → `/topics/<slug>`, built from a 9-item array.

- [ ] **Step 1: `git mv src/content/*.json scripts/legacy-content/`.**
- [ ] **Step 2: Write `scripts/migrate-content.ts` and run it:** `node scripts/migrate-content.ts`. Expected: 13 files written; report printed.
- [ ] **Step 3: Review the report.** For each code block whose detected lang is wrong, add an entry to `CODE_LANG_OVERRIDES`. For each `html` fallback, extend the parser in Task 3's file with a new rule and a test — or, if the markup is one-off, leave it and list it in the commit message. Re-run until the report is clean. Expected: 0 schema errors.
- [ ] **Step 4: Write `src/lib/topics.ts`, the new `SectionView`, and the unified `src/app/topics/[slug]/page.tsx`** (same layout as today's guide page; `generateStaticParams` from `TOPIC_ORDER`; metadata `title` = topic title, `description` = `stripTags(lede)` cut to 200 chars; prev/next across all 13). Update `page.tsx`, `SiteHeader.tsx`, `not-found.tsx` imports; delete the old files listed above.
- [ ] **Step 5: Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.** Expected: all pass; build lists 13 `/topics/[slug]` pages.
- [ ] **Step 6: Check routes.** Run `npm run start` in the background, then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/topics/agents-and-agentic-systems   # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" localhost:3000/guides/llm-fundamentals   # 308 …/topics/llm-fundamentals
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" localhost:3000/topics/03-inference      # 308 …/topics/inference
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/topics/nope    # 404
curl -s localhost:3000/topics/prompt-engineering | grep -c "&lt;document&gt;"   # ≥ 1
```

- [ ] **Step 7: Commit** — `feat: migrate content to typed blocks in 13-part order`. Include the legacy files move, the 13 new files, and the deletions.

---

### Task 7: Layout shell — tokens, fonts, header, sidebar

**Files:**
- Modify: `src/app/globals.css` (rewrite), `src/app/layout.tsx`
- Create: `src/components/layout/SiteHeader.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/SidebarList.tsx`, `src/components/layout/MobileNav.tsx`
- Delete: `src/components/SiteHeader.tsx`

**Interfaces:**
- Consumes: `getNavItems`, `NavItem` (Task 6).
- Produces:
  - `SidebarList({ items, activeSlug, onNavigate }: { items: NavItem[]; activeSlug: string | null; onNavigate?: () => void })` — plain list: `Part N` in mono plus title; active item marked with `aria-current="page"`.
  - `Sidebar({ items }: { items: NavItem[] })` — `"use client"`; reads `usePathname()`, derives `activeSlug` from `/topics/<slug>`; renders `SidebarList`.
  - `MobileNav({ items }: { items: NavItem[] })` — `"use client"`; menu button (visible below `lg`) opens a left drawer with `SidebarList`; closes on navigate, on Escape, and on backdrop click.
  - `SiteHeader({ items, searchSlot }: { items: NavItem[]; searchSlot?: React.ReactNode })` — logo link to `/`, `MobileNav`, and `searchSlot` (Task 8 passes the search trigger).
  - CSS custom properties (tokens): `--bg #0f1013`, `--bg-raised #16181d`, `--border #262931`, `--text #ebe8e2`, `--text-dim #a4a19a`, `--text-faint #6f6c66`, `--accent #5ec8d8`, `--voice-layman #b9a3f0`, `--voice-bangla #6fcf9f`, `--good #6fcf9f`, `--warn #e5b454`, `--danger #ef7f86`, `--pink #f09ac8`; exposed to Tailwind through `@theme inline` as `bg`, `bg-raised`, `border`, `text`, `text-dim`, `text-faint`, `accent`, `voice-layman`, `voice-bangla`, plus `--font-display`, `--font-sans`, `--font-mono`, `--font-bengali`.

**Layout:** header `h-14`, sticky. Below it, `lg:grid lg:grid-cols-[260px_minmax(0,1fr)]`. The sidebar column is `hidden lg:block`, sticky at `top-14`, height `calc(100vh - 3.5rem)`, scrolls on y. In `layout.tsx`, wrap `<Sidebar>` in `<Suspense fallback={<SidebarList items={items} activeSlug={null} />}>`. Remove the grid-paper body background. Keep `.prose-inline`, `.code-block`, `.shiki` rules from Task 5 (switched to the new tokens); delete every `.prose-guide` and `.source-list` rule that no component uses any more.

- [ ] **Step 1: Read `01-app/03-api-reference/04-functions/use-pathname.md` and the `next/font` page in the docs.**
- [ ] **Step 2: Implement the files.** Add `Fraunces` from `next/font/google` with `variable: "--font-display"`.
- [ ] **Step 3: Run `npx tsc --noEmit`, `npm run lint`, `npm run build`.** Expected: pass, with no "blocking-prerender-client-hook" error.
- [ ] **Step 4: Manual check in `npm run dev`:** at 1280 px the sidebar lists Parts 1–13 in order and marks the current one; at 375 px the sidebar is hidden and the menu button opens and closes the drawer; `/topics/nope` shows the 404 page.
- [ ] **Step 5: Commit** — `feat: add editorial layout shell with sidebar navigation`.

---

### Task 8: Search — index route and Ctrl/Cmd+K palette

**Files:**
- Create: `src/lib/search.ts`, `src/app/search-index.json/route.ts`, `src/components/navigation/SearchPalette.tsx`
- Modify: `package.json` (dependency `minisearch`), `src/app/layout.tsx` (pass the palette trigger as `searchSlot`)
- Test: `tests/search.test.ts`

**Interfaces:**
- Consumes: `Block`, `TopicFile` types (Task 1); `TOPICS`, `stripTags` (Task 6).
- Produces (from `src/lib/search.ts` — import types only, no `@/` imports, so tests can load it):
  - `type SearchDoc = { id: string; href: string; part: number; topic: string; title: string; text: string }`
  - `blockText(block: Block): string` — plain text of one block, recursing into containers; `code` → `code`; `diagram` → captions only; `divider` → `""`.
  - `buildSearchDocs(topics: (TopicFile & { part: number })[], strip: (html: string) => string): SearchDoc[]` — one doc per section; `id` = `` `${slug}#${section.id}` ``; `href` = `` `/topics/${slug}#${section.id}` ``; `text` = `strip(sub)` and the `blockText` of each `body` block (Technical voice only), joined with one space, runs of whitespace collapsed, trimmed.
  - `createIndex(docs: SearchDoc[]): MiniSearch<SearchDoc>` — fields `title`, `topic`, `text`; store fields `href`, `part`, `topic`, `title`; search options `{ prefix: true, fuzzy: 0.2, boost: { title: 3, topic: 1.5 } }`.
  - `runSearch(index: MiniSearch<SearchDoc>, query: string, limit = 8): SearchDoc[]` — returns `[]` for a blank query.
- Route: `GET /search-index.json` returns `Response.json(buildSearchDocs(TOPICS, stripTags))`. It reads no runtime data, so Next prerenders it (see `01-app/01-getting-started/15-route-handlers.md`, "With Cache Components").
- `SearchPalette()` — `"use client"`; renders the header trigger button (label "Search", hint `Ctrl K`) and the dialog. Opens on the button, on Ctrl+K, and on Cmd+K (`preventDefault`). On the first open it fetches `/search-index.json` and builds the index once. Arrow keys move the selection, Enter calls `router.push(href)` and closes, Escape and backdrop click close. Blank query: show "Type to search 13 parts." No hits: "No results." Fetch failure: "Search is unavailable." Dialog has `role="dialog"`, `aria-modal="true"`, and the input gets focus on open.

- [ ] **Step 1: Write the failing tests**

```ts
const topics = [{ part: 4, slug: "rag", title: "RAG", lede: "", sources: [], sections: [
  { id: "s7", num: "07", title: "Reranking: Cohere, BGE, Voyage", sub: "Cross-encoders", layman: [], bangla: [],
    body: [{ type: "callout", variant: "info", blocks: [{ type: "paragraph", html: "<strong>BM25</strong> first" }] }] }] }];
test("buildSearchDocs makes one doc per section with nested text", () => {
  const docs = buildSearchDocs(topics, (h) => h.replace(/<[^>]+>/g, ""));
  assert.deepEqual(docs[0], { id: "rag#s7", href: "/topics/rag#s7", part: 4, topic: "RAG",
    title: "Reranking: Cohere, BGE, Voyage", text: "Cross-encoders BM25 first" });
});
test("runSearch finds by prefix and ignores blank queries", () => {
  const idx = createIndex(buildSearchDocs(topics, (h) => h.replace(/<[^>]+>/g, "")));
  assert.equal(runSearch(idx, "rerank")[0].id, "rag#s7");
  assert.deepEqual(runSearch(idx, "   "), []);
});
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Install `minisearch`; implement `search.ts`, the route, and the palette; wire it in `layout.tsx`.**
- [ ] **Step 4: Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.** Expected: pass; the build output lists `/search-index.json` as prerendered.
- [ ] **Step 5: Manual check:** Ctrl+K opens the palette; "mcp" lists the Tool Use section first; Enter goes there; Escape closes. With the dev server's network tab blocking `/search-index.json`, the palette shows "Search is unavailable."
- [ ] **Step 6: Commit** — `feat: add Ctrl/Cmd+K search across all 13 parts`.

---

### Task 9: Topic reading page — voice switcher, TOC, header, sources

**Files:**
- Create: `src/components/content/VoiceSwitcher.tsx`, `src/components/navigation/SectionNav.tsx`, `src/components/content/Sources.tsx`, `src/components/content/TopicHeader.tsx`, `src/components/content/PrevNext.tsx`
- Modify: `src/components/content/SectionView.tsx`, `src/app/topics/[slug]/page.tsx`, `src/app/globals.css` (voice fade keyframes)
- Delete: `src/components/SectionNav.tsx`, `src/components/Sources.tsx`

**Interfaces:**
- Consumes: `Topic`, `getOutline`, `OutlineItem`, `getNeighbors` (Task 6); `ProseBlocks` (Task 5).
- Produces:
  - `type Voice = "main" | "layman" | "bangla" | "all"`
  - `VoiceSwitcher({ value, onChange, available }: { value: Voice; onChange: (v: Voice) => void; available: Voice[] })` — segmented control; one `button` per available voice with `aria-pressed`; labels from Global Constraints; active segment uses that voice's color (`main` → `--accent`, `layman` → `--voice-layman`, `bangla` → `--voice-bangla`, `all` → `--text`).
  - `SectionView({ section })` — `available` leaves out a voice whose blocks are empty, and leaves out `all` when only `main` is left. Layman's and Bangla render inside `<aside>` panels with the header copy from Global Constraints and `style={{ "--voice": … }}`; the Bangla panel has `lang="bn"` and `font-bengali`. The content wrapper has `key={voice}` and class `voice-fade` (180 ms opacity + 4 px rise; none under `prefers-reduced-motion`).
  - `SectionNav({ items }: { items: OutlineItem[] })` — client; IntersectionObserver as today, observing every outline id; level-3 items indented; heading "On this page".
  - `TopicHeader({ topic }: { topic: Topic })` — eyebrow `Part 05` (two digits, mono), `h1` in `font-display`, tagline in italic display font when present, lede via `Inline`, meta line `{n} sections · {m} sources · three voices`.
  - `PrevNext({ prev, next }: { prev?: Topic; next?: Topic })` — two cards: `← Part 04` + title, `Part 06 →` + title.
  - `Sources({ sources })` — numbered list, each `li` keeps `id={"src" + n}` (citation anchors depend on it).

**Page layout:** `xl:grid xl:grid-cols-[minmax(0,680px)_220px] xl:gap-16`, centered in the content column; the TOC column is `hidden xl:block`, sticky. Sections are spaced `space-y-24`.

- [ ] **Step 1: Implement the components and page.**
- [ ] **Step 2: Run `npx tsc --noEmit`, `npm run lint`, `npm run build`.** Expected: pass.
- [ ] **Step 3: Manual check in `npm run dev`:**
  - `/topics/tool-use-and-integrations`: the TOC lists the section plus its 5 `h3` subtopics; clicking one scrolls to it.
  - `/topics/llm-fundamentals`: each of the 4 voice options shows the right content; the fade runs; a citation `[3]` jumps to source 3.
  - `/topics/rag-knowledge-systems`: section 06 is "Reranking", section 08 is "GraphRAG".
  - At 375 px: no sideways page scroll on `/topics/inference` (tables, code, diagrams scroll in their own box).
- [ ] **Step 4: Commit** — `feat: rebuild topic reading page with voice switcher and outline TOC`.

---

### Task 10: Landing page and 404

**Files:**
- Modify: `src/app/page.tsx`, `src/app/not-found.tsx`

**Interfaces:**
- Consumes: `TOPICS`, `getOutline` (Task 6); `Inline` (Task 5).

**Decisions:**
- Masthead: eyebrow `Reference · 13 parts · {total sections} sections`; `h1` "All necessary topics related to AI Engineering" in `font-display` (no gradient); the existing intro paragraph about the three voices (keep its text).
- Index: an `<ol>` of the 13 parts, each a row divided by a top rule: big display numeral (`01`–`13`), title linked to `/topics/<slug>`, tagline in italic when present, then the outline titles as a muted, comma-separated line (level 2 titles for multi-section topics; level 3 titles for single-section topics — same rule as `getOutline`, so for one-section topics drop the level-2 item).
- 404: heading "Page not found", text "That page does not exist. All 13 parts are listed on the home page.", link "← Back to all parts".

- [ ] **Step 1: Implement both pages.**
- [ ] **Step 2: Run `npx tsc --noEmit`, `npm run lint`, `npm run build`.** Expected: pass.
- [ ] **Step 3: Manual check:** `/` lists Parts 1–13 in the spec's order, with Part 6 showing "Parallel tool calling, Model Context Protocol (MCP), …"; layout holds at 375 px.
- [ ] **Step 4: Commit** — `feat: rebuild landing page as editorial 13-part index`.

---

### Task 11: Cleanup, docs, final verification

**Files:**
- Delete: `scripts/` (legacy content, migration code), `tests/migrate-*.test.ts`
- Modify: `package.json` (remove `node-html-parser`, `shiki`), `README.md`, `src/app/layout.tsx` (metadata description and footer copy: "13 parts")

**Decisions:**
- `README.md`: replace the Routes, Content, File layout, and Design notes sections to match the new structure: one `/topics/[slug]` route plus redirects; the block model with a link to `src/lib/content-schema.ts`; "to edit content, edit `src/content/<slug>.json`; the build validates it"; `npm test`.
- Remaining tests: `tests/content-schema.test.ts`, `tests/search.test.ts`.

- [ ] **Step 1: Delete and update the files above;** run `npm install` to update the lockfile.
- [ ] **Step 2: Verify.** Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Expected: all pass. Run `grep -rn "dangerouslySetInnerHTML" src` — expected hits only in `Inline.tsx`, `CodeBlock.tsx`, `Diagram.tsx`, `RawHtml.tsx`.
- [ ] **Step 3: Full manual QA in `npm run start`:** every part 1–13 opens; each voice option on two sections per part renders; diagrams, code, callouts (all 5 variants), tables, panels, pill grids look right; Ctrl+K search works; old URLs redirect; 375 px and 1280 px widths hold.
- [ ] **Step 4: Commit** — `chore: remove migration tooling and update README`.
