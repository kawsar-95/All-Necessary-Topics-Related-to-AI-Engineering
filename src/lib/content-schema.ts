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

export type Section = {
  id: string;
  num: string;
  title: string;
  sub: Inline;
  body: Block[];
  layman: Block[];
  bangla: Block[];
};

export type Source = { n: number; url: string; text: string };

export type TopicFile = {
  slug: string;
  title: string;
  tagline?: string;
  lede: Inline;
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
    z.object({ type: z.literal("paragraph"), html: InlineSchema }),
    z.object({
      type: z.literal("heading"),
      level: z.union([z.literal(3), z.literal(4)]),
      id: z.string(),
      html: InlineSchema,
    }),
    z.object({
      type: z.literal("list"),
      ordered: z.boolean(),
      items: z.array(InlineSchema),
    }),
    z.object({
      type: z.literal("code"),
      lang: z.string(),
      code: z.string(),
      html: z.string(),
    }),
    z.object({
      type: z.literal("diagram"),
      svg: z.string(),
      caption: InlineSchema.optional(),
      captionBn: InlineSchema.optional(),
    }),
    z.object({
      type: z.literal("callout"),
      variant: CalloutVariantSchema,
      blocks: z.array(BlockSchema),
    }),
    z.object({ type: z.literal("analogy"), blocks: z.array(BlockSchema) }),
    z.object({
      type: z.literal("pillGrid"),
      items: z.array(z.object({ label: InlineSchema, value: InlineSchema })),
    }),
    z.object({
      type: z.literal("table"),
      headers: z.array(InlineSchema),
      rows: z.array(z.array(InlineSchema)),
    }),
    z.object({
      type: z.literal("panels"),
      panels: z.array(
        z.object({ heading: InlineSchema, blocks: z.array(BlockSchema) }),
      ),
    }),
    z.object({ type: z.literal("divider") }),
    z.object({ type: z.literal("html"), html: z.string() }),
  ]),
);

export const SectionSchema: z.ZodType<Section> = z.object({
  id: z.string(),
  num: z.string(),
  title: z.string(),
  sub: InlineSchema,
  body: z.array(BlockSchema),
  layman: z.array(BlockSchema),
  bangla: z.array(BlockSchema),
});

const SourceSchema = z.object({
  n: z.number(),
  url: z.string(),
  text: z.string(),
});

export const TopicFileSchema: z.ZodType<TopicFile> = z.object({
  slug: z.string(),
  title: z.string(),
  tagline: z.string().optional(),
  lede: InlineSchema,
  sections: z.array(SectionSchema),
  sources: z.array(SourceSchema),
});
