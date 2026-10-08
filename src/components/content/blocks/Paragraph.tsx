import type { Block } from "@/lib/content-schema";
import { Inline } from "../Inline";

export function Paragraph(block: Extract<Block, { type: "paragraph" }>) {
  return <Inline as="p" html={block.html} className="mb-3.5 text-[var(--text)]" />;
}
