import type { Video } from "@/lib/content-schema";
import { VideoCard } from "./VideoCard";

/** The "Watch" row under a section: one card per video. */
export function VideoList({ videos, sectionId }: { videos: Video[]; sectionId: string }) {
  if (!videos.length) return null;
  const headingId = `${sectionId}-videos`;
  return (
    <section aria-labelledby={headingId} className="border-t border-border pt-8">
      <h3
        id={headingId}
        className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-text-faint"
      >
        Watch · {videos.length} {videos.length === 1 ? "video" : "videos"}
      </h3>
      <ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2">
        {videos.map((video) => (
          <li key={video.id}>
            <VideoCard video={video} />
          </li>
        ))}
      </ul>
    </section>
  );
}
