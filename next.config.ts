import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    // Image uploads go through Server Actions as FormData. The default body
    // limit is 1MB, which rejected most photos in production. Our upload
    // helper caps images at 5MB, so allow a bit more headroom here.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
