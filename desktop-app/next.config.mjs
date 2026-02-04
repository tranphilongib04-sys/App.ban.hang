/** @type {import('next').NextConfig} */
const nextConfig = {
    // Standalone output for Docker deployment
    output: 'standalone',
    images: {
        unoptimized: true,
    },
    // Optimize large package imports for smaller bundle size
    experimental: {
        optimizePackageImports: ['lucide-react', 'date-fns'],
    },
};

export default nextConfig;
