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
    ];
  },
};

export default nextConfig;

