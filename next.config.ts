import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
     remotePatterns: [
      {
        protocol: 'https',
        hostname: 'go.dev',
        port: '',
        pathname: '/blog/go-brand/Go-Logo/PNG/**',
      },
      {
        protocol: 'https',
        hostname: 'webimages.mongodb.com',
        port: '',
        pathname: '/_com_assets/**',
      },
      {
        protocol: 'https',
        hostname: 'redis.io',
        port: '',
        pathname: '/wp-content/uploads/**',
      }
     ]
  }
};

export default nextConfig;
