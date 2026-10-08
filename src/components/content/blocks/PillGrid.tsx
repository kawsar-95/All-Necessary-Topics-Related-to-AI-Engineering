import type { Block } from "@/lib/content-schema";
import { Inline } from "../Inline";

export function PillGrid(block: Extract<Block, { type: "pillGrid" }>) {
  return (
    <div className="mt-4 mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
      {block.items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5"
        >
          <Inline
            as="div"
            html={item.label}
            className="mb-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-faint)]"
          />
          <Inline as="div" html={item.value} className="text-base font-semibold text-[var(--text)]" />
        </div>
      ))}
    </div>
  );
}
