import { z } from "zod";

export type Inline = string;
export type CalloutVariant = "info" | "good" | "warn" | "danger" | "pink";

export type Block =
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

export type Video = {
  id: string;
  title: string;
  channel: string;
  lang: "en" | "bn";
};

/**
 * The hosts a section may show or link to. A page on FRAMEABLE_HOSTS can be
 * shown in a frame. A page on LINK_ONLY_HOSTS sends a header that blocks
 * framing, so the site only links to it.
 */
export const FRAMEABLE_HOSTS: readonly string[] = [
  "poloclub.github.io",
  "bbycroft.net",
  "jalammar.github.io",
  "playground.tensorflow.org",
  "handbook.modular.com",
  "www.neuronpedia.org",
  "apple.github.io",
  "www.3blue1brown.com",
  "sebastianraschka.com",
];
export const LINK_ONLY_HOSTS: readonly string[] = [
  "magazine.sebastianraschka.com",
  "newsletter.maartengrootendorst.com",
];

/** The host of an https URL, or null for any other URL. */
export function httpsHost(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.hostname : null;
  } catch {
    return null;
  }
}

export function canFrameUrl(url: string): boolean {
  const host = httpsHost(url);
  return host !== null && FRAMEABLE_HOSTS.includes(host);
}

export function isAllowedEmbedUrl(url: string): boolean {
  const host = httpsHost(url);
  return host !== null && (FRAMEABLE_HOSTS.includes(host) || LINK_ONLY_HOSTS.includes(host));
}

/** A live page from another site, shown in a frame under the section intro. */
export type Embed = {
  /** An https URL on one of the listed hosts. */
  url: string;
  title: string;
  /** What to look at, in English and in Bangla. */
  note: Inline;
  noteBn: Inline;
  /** false: the publisher blocks framing, so show a link card only. */
  frame?: boolean;
  /** Load the frame when it scrolls into view. Use it only for light pages. */
  autoload?: boolean;
  /** Frame height in px. */
  height?: number;
  /**
   * For an app that needs a wide screen: the width in px that it is made for.
   * In a narrower column the frame keeps this width and shrinks to fit.
   */
  designWidth?: number;
};

/** One step of a practice task, done in an AI chat. */
export type PracticeStep = {
  /** Open a new chat for this step, or keep the same one. */
  chat: "new" | "same";
  /** What to do. */
  do: Inline;
  /** Text to copy into the chat. Plain text. */
  prompt?: string;
  /** What the reader should see after this step. */
  expect: Inline;
  /** A sample AI answer. Plain text. Real answers differ a little. */
  example?: string;
};

/** A practice task in one language. */
export type PracticeText = {
  title: string;
  why: Inline;
  steps: PracticeStep[];
  learned: Inline;
  done: Inline;
  check: { question: Inline; answer: Inline };
  challenge: Inline;
};

/** A hands-on task that a reader does in any free AI chat, in English and Bangla. */
export type Practice = { en: PracticeText; bn: PracticeText };

export type Section = {
  id: string;
  num: string;
  title: string;
  sub: Inline;
  /** The Bangla title and intro, for the Bangla site. */
  bn: { title: string; sub: Inline };
  body: Block[];
  layman: Block[];
  bangla: Block[];
  videos?: Video[];
  embeds?: Embed[];
  practice?: Practice[];
};

export type Source = { n: number; url: string; text: string };

export type TopicFile = {
  slug: string;
  title: string;
  tagline?: string;
  lede: Inline;
  /** The Bangla title, tagline, and intro, for the Bangla site. */
  bn: { title: string; tagline?: string; lede: Inline };
  sections: Section[];
  sources: Source[];
};

const TAG = /<[^>]*>/g;
const ALLOWED_TAGS: RegExp[] = [
  /^<\/?(strong|em|code)>$/,
  /^<br\s*\/?>$/,
  /^<a class="cite" href="#src\d+">$/,
  /^<a href="https?:\/\/[^"\s<>]+">$/,
  /^<\/a>$/,
];

export function isAllowedInline(html: string): boolean {
  const tags = html.match(TAG) ?? [];
  if (!tags.every((tag) => ALLOWED_TAGS.some((re) => re.test(tag)))) return false;
  return !html.replace(TAG, "").includes("<");
}

const InlineSchema = z.string().refine(isAllowedInline, {
  message: "Inline html uses a tag or attribute outside the allowlist",
});

const CalloutVariantSchema = z.enum(["info", "good", "warn", "danger", "pink"]);

export const BlockSchema: z.ZodType<Block> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.strictObject({ type: z.literal("paragraph"), html: InlineSchema }),
    z.strictObject({
      type: z.literal("heading"),
      level: z.union([z.literal(3), z.literal(4)]),
      id: z.string(),
      html: InlineSchema,
    }),
    z.strictObject({
      type: z.literal("list"),
      ordered: z.boolean(),
      items: z.array(InlineSchema),
    }),
    z.strictObject({
      type: z.literal("code"),
      lang: z.string(),
      code: z.string(),
      html: z.string(),
    }),
    z.strictObject({
      type: z.literal("diagram"),
      svg: z.string(),
      caption: InlineSchema.optional(),
      captionBn: InlineSchema.optional(),
    }),
    z.strictObject({
      type: z.literal("callout"),
      variant: CalloutVariantSchema,
      blocks: z.array(BlockSchema),
    }),
    z.strictObject({ type: z.literal("analogy"), blocks: z.array(BlockSchema) }),
    z.strictObject({
      type: z.literal("pillGrid"),
      items: z.array(z.strictObject({ label: InlineSchema, value: InlineSchema })),
    }),
    z.strictObject({
      type: z.literal("table"),
      headers: z.array(InlineSchema),
      rows: z.array(z.array(InlineSchema)),
    }),
    z.strictObject({
      type: z.literal("panels"),
      panels: z.array(
        z.strictObject({ heading: InlineSchema, blocks: z.array(BlockSchema) }),
      ),
    }),
    z.strictObject({ type: z.literal("divider") }),
    z.strictObject({ type: z.literal("html"), html: z.string() }),
  ]),
);

const VideoSchema = z.strictObject({
  id: z.string().regex(/^[A-Za-z0-9_-]{11}$/, "Expected an 11-character YouTube video id"),
  title: z.string().min(1),
  channel: z.string().min(1),
  lang: z.enum(["en", "bn"]),
});

const FilledInlineSchema = InlineSchema.refine((s) => s.trim().length > 0, {
  message: "Expected non-empty text",
});

const PlainTextSchema = z.string().trim().min(1);

const EmbedSchema = z
  .strictObject({
    url: z.string().refine(isAllowedEmbedUrl, {
      message: "An embed needs an https URL on a host in FRAMEABLE_HOSTS or LINK_ONLY_HOSTS",
    }),
    title: PlainTextSchema,
    note: FilledInlineSchema,
    noteBn: FilledInlineSchema,
    frame: z.boolean().optional(),
    autoload: z.boolean().optional(),
    height: z.number().int().min(320).max(1000).optional(),
    designWidth: z.number().int().min(600).max(1600).optional(),
  })
  .refine((e) => e.frame === false || canFrameUrl(e.url), {
    message: "This host does not allow framing. Set frame to false.",
  })
  .refine((e) => !(e.autoload && e.frame === false), {
    message: "A link card has nothing to autoload",
  });

const PracticeStepSchema = z.strictObject({
  chat: z.enum(["new", "same"]),
  do: FilledInlineSchema,
  prompt: PlainTextSchema.optional(),
  expect: FilledInlineSchema,
  example: PlainTextSchema.optional(),
});

const PracticeTextSchema = z.strictObject({
  title: PlainTextSchema,
  why: FilledInlineSchema,
  steps: z
    .array(PracticeStepSchema)
    .min(1)
    .refine((steps) => steps[0]?.chat === "new", {
      message: "The first step must open a new chat",
    }),
  learned: FilledInlineSchema,
  done: FilledInlineSchema,
  check: z.strictObject({ question: FilledInlineSchema, answer: FilledInlineSchema }),
  challenge: FilledInlineSchema,
});

const PracticeSchema = z.strictObject({ en: PracticeTextSchema, bn: PracticeTextSchema });

export const SectionSchema: z.ZodType<Section> = z.strictObject({
  id: z.string(),
  num: z.string(),
  title: z.string(),
  sub: InlineSchema,
  bn: z.strictObject({ title: PlainTextSchema, sub: InlineSchema }),
  body: z.array(BlockSchema),
  layman: z.array(BlockSchema),
  bangla: z.array(BlockSchema),
  videos: z.array(VideoSchema).optional(),
  embeds: z.array(EmbedSchema).optional(),
  practice: z.array(PracticeSchema).min(1).optional(),
});

const SourceSchema = z.strictObject({
  n: z.number(),
  url: z.string(),
  text: z.string(),
});

export const TopicFileSchema: z.ZodType<TopicFile> = z.strictObject({
  slug: z.string(),
  title: z.string(),
  tagline: z.string().optional(),
  lede: InlineSchema,
  bn: z.strictObject({
    title: PlainTextSchema,
    tagline: PlainTextSchema.optional(),
    lede: InlineSchema,
  }),
  sections: z.array(SectionSchema),
  sources: z.array(SourceSchema),
});
