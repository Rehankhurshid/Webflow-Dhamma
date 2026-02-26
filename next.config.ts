import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/portal",
};

export default nextConfig;

// Enable Cloudflare bindings in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
