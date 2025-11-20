const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permitir importar desde src/
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    // Configurar aliases para resolver imports
    // Usar path.resolve para asegurar rutas absolutas
    const rootPath = path.resolve(__dirname);
    const srcPath = path.resolve(__dirname, 'src');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': rootPath,
      '@/src': srcPath,
    };
    
    // Asegurar que webpack resuelva correctamente los módulos
    config.resolve.modules = [
      srcPath,
      path.resolve(__dirname, 'app'),
      'node_modules',
    ];
    
    // Asegurar que webpack pueda resolver extensiones TypeScript
    config.resolve.extensions = [
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ];
    
    return config;
  },
};

module.exports = nextConfig;

