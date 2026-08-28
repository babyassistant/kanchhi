import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "microphone=(self), camera=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;