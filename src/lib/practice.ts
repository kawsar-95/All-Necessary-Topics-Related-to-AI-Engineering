import type { Lang } from "./i18n.ts";

type Voice = "main" | "layman" | "bangla" | "all";

/**
 * The language of the practice tasks. The Bangla site always shows Bangla.
 * On the English site, the বাংলা voice shows Bangla and the rest English.
 */
export function practiceLang(voice: Voice, siteLang: Lang = "en"): Lang {
  return siteLang === "bn" || voice === "bangla" ? "bn" : "en";
}
