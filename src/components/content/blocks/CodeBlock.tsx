import type { Block } from "@/lib/content-schema";

export function CodeBlock(block: Extract<Block, { type: "code" }>) {
  return (
    <div className="code-block">
      {block.lang !== "text" && (
        <span className="code-block-lang" aria-hidden="true">
          {block.lang}
        </span>
      )}
      <div dangerouslySetInnerHTML={{ __html: block.html }} />
    </div>
  );
}
