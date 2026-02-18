import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@festibee/ui", "@festibee/api"],
};

export default nextConfig;
