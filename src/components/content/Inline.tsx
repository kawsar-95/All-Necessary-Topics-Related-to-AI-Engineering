type InlineTag = "span" | "p" | "div" | "li" | "td" | "th" | "h3" | "h4";

type InlineProps = {
  html: string;
  as?: InlineTag;
  className?: string;
  id?: string;
};

/**
 * The one place that renders an Inline string as HTML.
 * The content schema checks every Inline string against a tag allowlist.
 */
export function Inline({ html, as = "span", className, id }: InlineProps) {
  const Tag = as;
  return (
    <Tag
      id={id}
      className={className ? `prose-inline ${className}` : "prose-inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
