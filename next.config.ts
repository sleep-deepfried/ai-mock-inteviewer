import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse", "mammoth", "@napi-rs/canvas"],
  async redirects() {
    return [{ source: "/contact", destination: "/support", permanent: true }];
  },
};

export default nextConfig;
