import type { Block } from "@/lib/content-schema";

export function RawHtml(block: Extract<Block, { type: "html" }>) {
  return <div data-fallback dangerouslySetInnerHTML={{ __html: block.html }} />;
}
