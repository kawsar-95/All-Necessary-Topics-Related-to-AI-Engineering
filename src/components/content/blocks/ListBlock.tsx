import type { Block } from "@/lib/content-schema";
import { Inline } from "../Inline";

export function ListBlock(block: Extract<Block, { type: "list" }>) {
  const Tag = block.ordered ? "ol" : "ul";
  const style = block.ordered ? "list-decimal" : "list-disc";
  return (
    <Tag className={`${style} mb-4 pl-[22px] marker:text-[var(--accent)]`}>
      {block.items.map((item, i) => (
        <Inline key={i} as="li" html={item} className="my-1 text-[var(--text)]" />
      ))}
    </Tag>
  );
}
