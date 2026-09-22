import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve modern formats when the browser supports them. AVIF first (best
    // compression), then WebP, then the original as fallback. next/image
    // negotiates this per-request; the source files in Storage are untouched.
    formats: ["image/avif", "image/webp"],
    // Cache optimized image variants for at least a day on the CDN/edge.
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Gzip/brotli compression for HTML/JS/CSS responses.
  compress: true,
  poweredByHeader: false,
  experimental: {
    // Image uploads go through Server Actions as FormData. The default body
    // limit is 1MB, which rejected most photos in production. Our upload
    // helper caps images at 5MB, so allow a bit more headroom here.
    serverActions: {
      bodySizeLimit: "6mb",
    },
    // Tree-shake MUI icon imports so only the icons actually used ship to the
    // client, reducing JS. Purely a build optimization — no behaviour change.
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },
  // How long the optimized-image cache lives (Next controls /_next/image
  // caching internally; we just extend the TTL to 1 day). Avoids setting a
  // manual Cache-Control on /_next/image, which can break dev behaviour.
  // (images.minimumCacheTTL is set inside the `images` block above.)
  async headers() {
    return [
      {
        // Static assets under /public (icons, svgs, fonts) — long-term immutable.
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
