import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Enable WebAssembly required by cardano-serialization-lib-browser */
  webpack: (config) => {
    if (!config.experiments) config.experiments = {} as any;
    (config.experiments as any).asyncWebAssembly = true;
    
    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          cardano: {
            test: /[\\/]node_modules[\\/](@emurgo|@meshsdk)[\\/]/,
            name: 'cardano',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };
    
    return config;
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Compression
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  eslint: {
    // Ignore ESLint errors during production builds (Docker image)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript type errors during production builds
    ignoreBuildErrors: true,
  },
  
  // Headers for better caching and security
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=30, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/uploads/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
