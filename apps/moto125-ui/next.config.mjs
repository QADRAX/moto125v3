import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const monorepoRoot = path.join(__dirname, "../..");

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    outputFileTracingRoot: monorepoRoot,
    outputFileTracingIncludes: {
      "*": [
        "packages/data-mirror/**",
        "packages/data-mirror-core/**",
        "packages/data-mirror-worker/**",
      ],
    },
  },
};

export default config;
