import Link from "next/link";
import type { NavItem } from "@/lib/topics";

// Client files take the type from here. A type import is erased at build
// time, so no server code from topics.ts goes into the client bundle.
export type { NavItem };

/** Returns the topic slug of a `/topics/<slug>` path, or null. */
export function activeSlugFromPath(pathname: string | null): string | null {
  const match = pathname?.match(/^\/topics\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * The list of Parts 1–13. A plain component without hooks, so the server
 * layout can render it as the Suspense fallback and the client Sidebar and
 * MobileNav can render it with the active slug.
 */
export function SidebarList({
  items,
  activeSlug,
  onNavigate,
}: {
  items: NavItem[];
  activeSlug: string | null;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Parts" className="px-3 py-6">
      <p className="mb-3 px-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-faint">
        Parts
      </p>
      <ol className="m-0 list-none space-y-px p-0">
        {items.map((item) => {
          const active = item.slug === activeSlug;
          return (
            <li key={item.slug}>
              <Link
                href={`/topics/${item.slug}`}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={
                  "group block rounded-r-md border-l-2 px-3 py-2 no-underline transition-colors " +
                  (active
                    ? "border-accent bg-bg-raised"
                    : "border-transparent hover:border-border-strong hover:bg-bg-raised/60")
                }
              >
                <span
                  className={
                    "block font-mono text-[10.5px] uppercase tracking-[0.12em] " +
                    (active ? "text-accent" : "text-text-faint")
                  }
                >
                  Part {item.part}
                </span>
                <span
                  className={
                    "mt-0.5 block text-[13.5px] leading-snug " +
                    (active ? "text-text" : "text-text-dim group-hover:text-text")
                  }
                >
                  {item.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
