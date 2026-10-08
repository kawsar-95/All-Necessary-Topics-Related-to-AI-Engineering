import type { MetadataRoute } from "next";

// output: "export" writes this file at build time.
export const dynamic = "force-static";

/**
 * The web app manifest. The browser resolves each URL here against the
 * manifest URL, so relative URLs also work under the GitHub Pages base path.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Engineering — All Necessary Topics",
    short_name: "AI Engineering",
    description:
      "Thirteen reference parts for applied AI engineers. Each topic in three voices: technical, layman, and বাংলা.",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#0f1013",
    theme_color: "#0f1013",
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
