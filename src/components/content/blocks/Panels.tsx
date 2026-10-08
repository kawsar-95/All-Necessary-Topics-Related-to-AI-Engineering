import type { Block } from "@/lib/content-schema";
import { Inline } from "../Inline";
import { ProseBlocks } from "../ProseBlocks";

export function Panels(block: Extract<Block, { type: "panels" }>) {
  return (
    <div className="my-5 grid gap-4 sm:grid-cols-2">
      {block.panels.map((panel, i) => (
        <section
          key={i}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-4 [&>:last-child]:mb-0"
        >
          <Inline
            as="h4"
            html={panel.heading}
            className="mb-2 text-base font-semibold text-[var(--text)]"
          />
          <ProseBlocks blocks={panel.blocks} />
        </section>
      ))}
    </div>
  );
}
