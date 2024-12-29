import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      };
    }
    return config;
  },
  experimental: {
    turbo: {
      rules: {
        // Disable the warning about webpack configuration
        "no-webpack-config": false
      }
    }
  }
};

export default nextConfig;
