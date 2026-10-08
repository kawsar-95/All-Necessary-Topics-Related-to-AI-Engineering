import type { Block } from "@/lib/content-schema";
import { Analogy } from "./blocks/Analogy";
import { Callout } from "./blocks/Callout";
import { CodeBlock } from "./blocks/CodeBlock";
import { Diagram } from "./blocks/Diagram";
import { Divider } from "./blocks/Divider";
import { Heading } from "./blocks/Heading";
import { ListBlock } from "./blocks/ListBlock";
import { Panels } from "./blocks/Panels";
import { Paragraph } from "./blocks/Paragraph";
import { PillGrid } from "./blocks/PillGrid";
import { RawHtml } from "./blocks/RawHtml";
import { Table } from "./blocks/Table";

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "paragraph":
      return <Paragraph key={key} {...block} />;
    case "heading":
      return <Heading key={key} {...block} />;
    case "list":
      return <ListBlock key={key} {...block} />;
    case "code":
      return <CodeBlock key={key} {...block} />;
    case "diagram":
      return <Diagram key={key} {...block} />;
    case "callout":
      return <Callout key={key} {...block} />;
    case "analogy":
      return <Analogy key={key} {...block} />;
    case "pillGrid":
      return <PillGrid key={key} {...block} />;
    case "table":
      return <Table key={key} {...block} />;
    case "panels":
      return <Panels key={key} {...block} />;
    case "divider":
      return <Divider key={key} />;
    case "html":
      return <RawHtml key={key} {...block} />;
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

export function ProseBlocks({ blocks }: { blocks: Block[] }) {
  return <>{blocks.map((block, i) => renderBlock(block, i))}</>;
}
