// The site's two languages. English pages live at the root ("/topics/x/"),
// Bangla pages under "/bn" ("/bn/topics/x/"). This file has no server-only
// imports, so client components and `node --test` can use it.

export type Lang = "en" | "bn";
export const LANGS: readonly Lang[] = ["en", "bn"];

/** The localStorage key that holds the reader's language choice. */
export const LANG_STORAGE_KEY = "lang";

/** The language of a path without the base path. */
export function langFromPath(path: string): Lang {
  return path === "/bn" || path.startsWith("/bn/") ? "bn" : "en";
}

/** The same page in `lang`. `path` has no base path. */
export function localizedPath(path: string, lang: Lang): string {
  const english = langFromPath(path) === "bn" ? path.slice(3) || "/" : path;
  if (lang === "en") return english;
  return english === "/" ? "/bn/" : `/bn${english}`;
}

/** The home page and a topic page in `lang`. */
export function homeHref(lang: Lang): string {
  return lang === "bn" ? "/bn/" : "/";
}
export function topicHref(slug: string, lang: Lang): string {
  return `${lang === "bn" ? "/bn" : ""}/topics/${slug}`;
}

/** A number in the digits of `lang`. */
export function fmtNum(lang: Lang, n: number): string {
  return lang === "bn" ? new Intl.NumberFormat("bn-BD").format(n) : String(n);
}

/**
 * Runs in <head> before the first paint. It sets <html lang> from the path.
 * If the reader chose the other language before, it opens the same page in
 * that language. It must agree with langFromPath and localizedPath
 * (tests/i18n.test.ts checks this).
 */
export function langInitScript(basePath: string): string {
  return `(function(){try{var b=${JSON.stringify(basePath)},l=location,p=l.pathname;if(b&&p.indexOf(b)===0)p=p.slice(b.length)||"/";var bn=p==="/bn"||p.indexOf("/bn/")===0;document.documentElement.setAttribute("lang",bn?"bn":"en");var s=localStorage.getItem(${JSON.stringify(
    LANG_STORAGE_KEY,
  )});if((s==="bn"&&!bn)||(s==="en"&&bn)){var e=bn?p.slice(3)||"/":p,t=s==="en"?e:e==="/"?"/bn/":"/bn"+e;l.replace(b+t+l.search+l.hash)}}catch(x){}})()`;
}

const en = {
  siteName: "AI Engineering",
  skipLink: "Skip to content",
  footer: "13 parts · citations verified against each publisher's metadata.",
  metaTitle: "AI Engineering — All Necessary Topics",
  metaDescription:
    "Thirteen reference parts covering every topic an applied AI engineer needs, from LLM fundamentals and prompt engineering to agents, inference, evaluation, safety, and AI application architecture. Each topic in three voices: technical, layman, and বাংলা.",

  // Language and theme switches.
  langSwitchText: "বাংলা",
  langSwitchLabel: "বাংলায় পড়ো",
  themeToLight: "Switch to light theme",
  themeToDark: "Switch to dark theme",
  themeGeneric: "Switch color theme",
  installApp: "Install this site as an app",

  // Navigation.
  partsNav: "Parts",
  part: (n: string) => `Part ${n}`,
  openParts: "Open the list of parts",
  closeParts: "Close the list of parts",
  onThisPage: "On this page",
  prevNextNav: "Previous and next Part",

  // Search.
  search: "Search",
  searchAll: "Search all 13 parts",
  searchUnavailable: "Search is unavailable.",
  searchType: "Type to search 13 parts.",
  searchLoading: "Loading…",
  searchNone: "No results.",
  searchClose: "Close search",
  searchResults: "Search results",

  // Home page.
  homeEyebrow: (parts: string, sections: string) => `Reference · ${parts} parts · ${sections} sections`,
  homeTitle: "All necessary topics related to AI Engineering",
  homeIntro:
    "A dense, citation-backed reference for the fundamentals every applied AI engineer needs — from tokens and tool use to retrieval, context, and agent loops. Each topic ships in three voices: the engineer's version (with code and diagrams), the layman's version (plain English with analogies), and <span lang=\"bn\" class=\"text-voice-bangla\">বাংলা ব্যাখ্যা</span>.",
  contents: "Contents",

  // Topic page.
  topicMeta: (sections: number, sources: number) =>
    `${sections} ${sections === 1 ? "section" : "sections"} · ${sources} ${sources === 1 ? "source" : "sources"} · three voices`,
  references: "References",
  sources: "Sources",
  sourcesNote:
    "All citations resolve to primary papers (arXiv), vendor docs (OpenAI, Anthropic, Google), or official team blogs. IDs were verified by fetching each page and extracting the citation metadata.",

  // Voices.
  voiceGroup: "Voice",
  voiceMain: "Technical",
  voiceLayman: "Layman's",
  voiceBangla: "বাংলা",
  voiceAll: "All three",
  laymanTitle: "Layman's version",
  laymanNote: "plain English, no jargon",
  banglaTitle: "বাংলা ব্যাখ্যা",
  banglaNote: "সহজ ভাষায় বিস্তারিত",

  // Videos.
  watch: (n: number) => `Watch · ${n} ${n === 1 ? "video" : "videos"}`,
  playVideo: (title: string) => `Play video: ${title}`,

  // 404.
  notFoundEyebrow: "Error 404",
  notFoundTitle: "Page not found",
  notFoundText: "That page does not exist. All 13 parts are listed on the home page.",
  notFoundBack: "← Back to all parts",
};

export type Dict = typeof en;

const bn: Dict = {
  siteName: "AI Engineering",
  skipLink: "মূল লেখায় যাও",
  footer: "১৩টি part · প্রতিটি source প্রকাশকের তথ্যের সাথে মিলিয়ে যাচাই করা।",
  metaTitle: "AI Engineering — দরকারি সব বিষয়, বাংলায়",
  metaDescription:
    "Applied AI engineer-এর দরকারি সব বিষয় ১৩টি part-এ: LLM-এর মূল ধারণা, prompt engineering থেকে agent, inference, evaluation, safety আর AI app architecture পর্যন্ত। প্রতিটি বিষয় সহজ বাংলা ব্যাখ্যা, practice task আর video সহ।",

  langSwitchText: "English",
  langSwitchLabel: "Read in English",
  themeToLight: "Light theme-এ যাও",
  themeToDark: "Dark theme-এ যাও",
  themeGeneric: "Theme বদলাও",
  installApp: "এই site-টা app হিসেবে install করো",

  partsNav: "Part-গুলো",
  part: (n: string) => `Part ${n}`,
  openParts: "Part-এর তালিকা খোলো",
  closeParts: "Part-এর তালিকা বন্ধ করো",
  onThisPage: "এই পাতায়",
  prevNextNav: "আগের আর পরের Part",

  search: "খোঁজো",
  searchAll: "১৩টি part-এ খোঁজো",
  searchUnavailable: "এখন search কাজ করছে না।",
  searchType: "১৩টি part-এ খুঁজতে লেখো।",
  searchLoading: "Load হচ্ছে…",
  searchNone: "কিছু পাওয়া যায়নি।",
  searchClose: "Search বন্ধ করো",
  searchResults: "Search-এর ফলাফল",

  homeEyebrow: (parts: string, sections: string) => `Reference · ${parts}টি part · ${sections}টি section`,
  homeTitle: "AI Engineering-এর দরকারি সব বিষয়",
  homeIntro:
    "একজন AI engineer-এর যা যা জানা দরকার, সব এক জায়গায়: token আর tool use থেকে শুরু করে retrieval, context আর agent loop পর্যন্ত। প্রতিটি বিষয়ে আছে সহজ <span class=\"text-voice-bangla\">বাংলা ব্যাখ্যা</span>, হাতে-কলমে practice task আর video। চাইলে technical English version আর সহজ English version-ও পড়তে পারো।",
  contents: "সূচিপত্র",

  topicMeta: (sections: number, sources: number) =>
    `${fmtNum("bn", sections)}টি section · ${fmtNum("bn", sources)}টি source · তিনভাবে ব্যাখ্যা`,
  references: "তথ্যসূত্র",
  sources: "Sources",
  sourcesNote:
    "সব citation মূল paper (arXiv), vendor-এর docs (OpenAI, Anthropic, Google) বা official team blog-এ যায়। প্রতিটি পাতা খুলে citation-এর তথ্য যাচাই করা হয়েছে।",

  voiceGroup: "ব্যাখ্যার ধরন",
  voiceMain: "Technical",
  voiceLayman: "সহজ English",
  voiceBangla: "বাংলা",
  voiceAll: "সবগুলো",
  laymanTitle: "Layman's version",
  laymanNote: "সহজ English-এ, jargon ছাড়া",
  banglaTitle: "বাংলা ব্যাখ্যা",
  banglaNote: "সহজ ভাষায় বিস্তারিত",

  watch: (n: number) => `ভিডিও দেখো · ${fmtNum("bn", n)}টি`,
  playVideo: (title: string) => `Video চালাও: ${title}`,

  notFoundEyebrow: "Error 404",
  notFoundTitle: "পাতাটি পাওয়া যায়নি",
  notFoundText: "এই পাতাটি নেই। Home page-এ ১৩টি part-এর তালিকা আছে।",
  notFoundBack: "← সব part-এ ফিরে যাও",
};

export const UI: Record<Lang, Dict> = { en, bn };
