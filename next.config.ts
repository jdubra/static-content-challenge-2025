import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow tests to use an isolated build dir so they don't clash with a running dev server.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",

  // The content routes read src/content/**/index.md at request time via dynamic
  // paths, which Next's output file tracing cannot detect statically. Without
  // this, the markdown files are not bundled into the serverless functions on
  // Vercel and every content page 404s. Force them to be included.
  outputFileTracingIncludes: {
    "/": ["./src/content/**/*"],
    "/[...slug]": ["./src/content/**/*"],
  },
};

export default nextConfig;
