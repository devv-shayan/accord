import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.ACCORD_BUILD_DIR || ".next",
  typedRoutes: true,
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: { "/api/recordings/*": ["./node_modules/ffmpeg-static/ffmpeg"] },
};

export default nextConfig;
