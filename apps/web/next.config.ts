import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@barista-gigs/shared"],
  turbopack: {
    root: "../..",
  },
};

export default nextConfig;
