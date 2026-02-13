import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  poweredByHeader: false,
  turbopack: {
    root: '.',
  },
};

export default nextConfig;
