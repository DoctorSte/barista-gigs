import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  async redirects() {
    // The café namespace used to live at /shop; old links (e.g. in stored
    // notifications) keep working.
    return [{ source: "/shop/:path*", destination: "/cafe/:path*", permanent: false }];
  },
  async rewrites() {
    // Pretty shareable passport URLs: baristagigs.com/@lea/passport
    return [{ source: "/@:username/passport", destination: "/passport/:username" }];
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
