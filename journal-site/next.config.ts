import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/_styleguide',
        destination: '/styleguide',
      },
    ];
  },
};

export default nextConfig;
