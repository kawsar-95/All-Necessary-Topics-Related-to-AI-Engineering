import type { Block } from "@/lib/content-schema";
import { ProseBlocks } from "../ProseBlocks";

export function Analogy(block: Extract<Block, { type: "analogy" }>) {
  return (
    <div className="my-[18px] rounded-[10px] border-l-[3px] border-[var(--voice,var(--accent))] bg-[var(--bg-card-2)] px-[18px] py-3.5 [&>:last-child]:mb-0">
      <ProseBlocks blocks={block.blocks} />
    </div>
  );
}
