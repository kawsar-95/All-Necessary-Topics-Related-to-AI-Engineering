import type { NextConfig } from "next";

// Old chapter URLs were /topics/0N-<slug>; the topic now lives at /topics/<slug>.
const OLD_CHAPTER_SLUGS = [
  "01-agents-and-agentic-systems",
  "02-tool-use-and-integrations",
  "03-inference",
  "04-llmops-and-observability",
  "05-evaluation-engineering",
  "06-cost-and-performance-optimization",
  "07-safety-security-and-guardrails",
  "08-multimodal-engineering",
  "09-ai-application-architecture",
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      { source: "/guides/:slug", destination: "/topics/:slug", permanent: true },
      ...OLD_CHAPTER_SLUGS.map((old) => ({
        source: `/topics/${old}`,
        destination: `/topics/${old.slice(3)}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
