import type { Block } from "@/lib/content-schema";
import { Inline } from "../Inline";

export function Table(block: Extract<Block, { type: "table" }>) {
  return (
    <div className="mt-4 mb-[22px] overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--bg-raised)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {block.headers.map((header, i) => (
              <Inline
                key={i}
                as="th"
                html={header}
                className="border-b border-[var(--border)] bg-[var(--bg-raised-2)] px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.04em] text-[var(--text)]"
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r} className="[&:last-child>td]:border-b-0">
              {row.map((cell, c) => (
                <Inline
                  key={c}
                  as="td"
                  html={cell}
                  className="border-b border-[var(--border)] px-3.5 py-2.5 text-left align-top text-[var(--text-dim)]"
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
