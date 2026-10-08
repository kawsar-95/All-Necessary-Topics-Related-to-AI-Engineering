import type { Block } from "@/lib/content-schema";
import { Inline } from "../Inline";

export function Heading(block: Extract<Block, { type: "heading" }>) {
  const isH3 = block.level === 3;
  return (
    <Inline
      as={isH3 ? "h3" : "h4"}
      id={block.id}
      html={block.html}
      className={
        "scroll-mt-24 font-semibold text-[var(--text)] " +
        (isH3 ? "mt-8 mb-2.5 text-[19px]" : "mt-6 mb-2 text-base")
      }
    />
  );
}
