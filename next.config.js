const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permitir importar desde src/
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    // Configurar aliases para resolver imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@/src': path.resolve(__dirname, 'src'),
    };
    
    // Asegurar que webpack resuelva correctamente los módulos
    config.resolve.modules = [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'app'),
      'node_modules',
    ];
    
    return config;
  },
};

module.exports = nextConfig;

