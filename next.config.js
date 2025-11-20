const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permitir importar desde src/
  transpilePackages: [],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@/src': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;

