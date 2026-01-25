import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Disable image optimization for Electron
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Ensure webpack resolves modules from the project directory
    config.resolve = config.resolve || {};
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      ...(config.resolve.modules || ['node_modules']),
    ];
    
    // Ensure webpack looks in the correct directory first
    config.resolve.roots = [
      path.resolve(__dirname),
      ...(config.resolve.roots || []),
    ];
    
    // Fix for CSS imports resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      'tailwindcss': path.resolve(__dirname, 'node_modules/tailwindcss'),
    };
    
    return config;
  },
};

export default nextConfig;
