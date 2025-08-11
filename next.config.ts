import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Enable WebAssembly required by cardano-serialization-lib-browser */
  webpack: (config) => {
    if (!config.experiments) config.experiments = {} as any;
    (config.experiments as any).asyncWebAssembly = true;
    return config;
  },
};

export default nextConfig;
