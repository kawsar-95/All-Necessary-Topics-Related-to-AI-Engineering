export function extractCode(preInnerHtml: string): string {
  return preInnerHtml
    .replace(/<\/?span\b[^>]*>/gi, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replace(/^\n/, "")
    .replace(/\n$/, "");
}
