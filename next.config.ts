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
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/wikipedia/commons/thumb/0/01/Apache_Kafka_logo.svg/**',
      }
     ]
  }
};

export default nextConfig;
