import { TOPICS, stripTags } from "@/lib/topics";
import { buildSearchDocs } from "@/lib/search";

// The handler reads no request data, so Next prerenders it at build time.
export function GET() {
  return Response.json(buildSearchDocs(TOPICS, stripTags));
}
