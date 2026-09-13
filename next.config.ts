import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // for testing only
  // allowedDevOrigins: ["192.168.18.20"],
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
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/d/**',
      }
     ]
  },
};

export default nextConfig;
