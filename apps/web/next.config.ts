import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@sahitech/domain', '@sahitech/database'],
  experimental: {}
};

export default nextConfig;

