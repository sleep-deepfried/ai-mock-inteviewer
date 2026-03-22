import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serverless-compatible config for Vercel deployment
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
