type Voice = "main" | "layman" | "bangla" | "all";

/** The language of the practice tasks for a voice: বাংলা shows Bangla, the rest English. */
export function practiceLang(voice: Voice): "en" | "bn" {
  return voice === "bangla" ? "bn" : "en";
}
