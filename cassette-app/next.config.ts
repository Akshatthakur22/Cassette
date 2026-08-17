import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Server Actions are properly configured
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['cassette-share.vercel.app', 'localhost:3000'],
    },
  },
  
  // Optimize for serverless
  poweredByHeader: false,
  
  // Configure image optimization - enable WebP/AVIF
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [85],
    dangerouslyAllowSVG: true,
  },
  
  // Ensure proper headers for caching
  async headers() {
    return [
      {
        source: '/t/:publicId',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'image/:format',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/voice-recordings/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'audio/webm',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

