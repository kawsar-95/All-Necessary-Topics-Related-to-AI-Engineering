import type { Block, CalloutVariant } from "@/lib/content-schema";
import { ProseBlocks } from "../ProseBlocks";

const VARIANT_COLOR: Record<CalloutVariant, string> = {
  info: "var(--accent)",
  good: "var(--good)",
  warn: "var(--warn)",
  danger: "var(--danger)",
  pink: "var(--pink)",
};

export function Callout(block: Extract<Block, { type: "callout" }>) {
  const color = VARIANT_COLOR[block.variant];
  return (
    <div
      className="my-[18px] rounded-[10px] border-l-[3px] px-[18px] py-3.5 text-sm [&>:last-child]:mb-0"
      style={{
        borderLeftColor: color,
        backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
      }}
    >
      <ProseBlocks blocks={block.blocks} />
    </div>
  );
}
