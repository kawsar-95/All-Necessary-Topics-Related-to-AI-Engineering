import type { Block } from "@/lib/content-schema";
import { Inline } from "../Inline";

export function Diagram(block: Extract<Block, { type: "diagram" }>) {
  return (
    <figure className="my-5 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-4">
      <div
        className="diagram-svg overflow-x-auto [&>svg]:block [&>svg]:h-auto [&>svg]:w-full [&>svg]:min-w-[640px]"
        dangerouslySetInnerHTML={{ __html: block.svg }}
      />
      {block.caption && (
        <figcaption className="mt-2.5 border-t border-dashed border-[var(--border-strong)] pt-2.5 text-[13px] italic text-[var(--text-dim)]">
          <Inline html={block.caption} />
        </figcaption>
      )}
      {block.captionBn && (
        <figcaption lang="bn" className="mt-1 text-[13px] text-[var(--text-faint)]">
          <Inline html={block.captionBn} />
        </figcaption>
      )}
    </figure>
  );
}
