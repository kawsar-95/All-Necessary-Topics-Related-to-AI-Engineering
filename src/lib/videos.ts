import type { Video } from "./content-schema.ts";
import type { Lang } from "./i18n.ts";

type Voice = "main" | "layman" | "bangla" | "all";

/**
 * The videos a section shows. The Bangla site shows Bangla videos first,
 * then English, in every voice. On the English site, Technical and Layman's
 * show the English videos, বাংলা shows Bangla first then English (so a section
 * without a Bangla video still has something to watch), and All three shows
 * all of them.
 */
export function videosForVoice(videos: Video[] | undefined, voice: Voice, siteLang: Lang = "en"): Video[] {
  const english = (videos ?? []).filter((v) => v.lang === "en");
  const bangla = (videos ?? []).filter((v) => v.lang === "bn");
  if (siteLang === "bn") return [...bangla, ...english];
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
