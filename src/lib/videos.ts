import type { Video } from "./content-schema.ts";

type Voice = "main" | "layman" | "bangla" | "all";

/**
 * The videos a section shows for a voice. Technical and Layman's show the
 * English videos. বাংলা shows Bangla videos first, then English, so a section
 * without a Bangla video still has something to watch. All three shows all.
 */
export function videosForVoice(videos: Video[] | undefined, voice: Voice): Video[] {
  const english = (videos ?? []).filter((v) => v.lang === "en");
  const bangla = (videos ?? []).filter((v) => v.lang === "bn");
  switch (voice) {
    case "main":
    case "layman":
      return english;
    case "bangla":
      return [...bangla, ...english];
    case "all":
      return [...english, ...bangla];
  }
}
