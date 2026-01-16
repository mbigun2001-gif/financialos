/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  compiler: {
    removeConsole: false,
  },
  experimental: {
    forceSwcTransforms: false,
  },
}

// Умовна конфігурація PWA (тільки якщо пакет встановлений)
try {
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'offlineCache',
          expiration: {
            maxEntries: 200,
          },
        },
      },
    ],
  });
  module.exports = withPWA(nextConfig);
} catch (error) {
  // Якщо next-pwa не встановлений, використовуємо звичайну конфігурацію
  console.log('PWA support disabled (next-pwa not installed)');
  module.exports = nextConfig;
}
