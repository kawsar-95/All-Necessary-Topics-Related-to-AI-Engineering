const KNOWN_TAGS = new Set([
  "p", "h3", "h4", "ul", "ol", "li", "pre", "code", "table", "thead", "tbody",
  "tr", "th", "td", "hr", "div", "span", "strong", "em", "a", "br", "small",
  "sup", "sub", "b", "i", "svg",
]);

const SVG_REGION = /<svg[\s>][\s\S]*?<\/svg>/gi;
const TAG = /<(\/?)([A-Za-z][^<>]*)>/g;

function escapeOutsideSvg(html: string): string {
  return html.replace(TAG, (match, slash: string, rest: string) => {
    const name = /^[A-Za-z][A-Za-z0-9-]*/.exec(rest)?.[0] ?? "";
    if (KNOWN_TAGS.has(name.toLowerCase())) return match;
    return `&lt;${slash}${rest}&gt;`;
  });
}

export function escapePseudoTags(html: string): string {
  let out = "";
  let last = 0;
  for (const region of html.matchAll(SVG_REGION)) {
    out += escapeOutsideSvg(html.slice(last, region.index));
    out += region[0];
    last = region.index + region[0].length;
  }
  return out + escapeOutsideSvg(html.slice(last));
}
