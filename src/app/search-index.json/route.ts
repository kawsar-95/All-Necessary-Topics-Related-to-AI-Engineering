import { TOPICS, stripTags } from "@/lib/topics";
import { buildSearchDocs } from "@/lib/search";

export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchDocs(TOPICS, stripTags));
}
