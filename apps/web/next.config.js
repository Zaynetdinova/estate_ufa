/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker uses the standalone server; Vercel manages its own Next.js runtime.
  output: process.env.VERCEL ? undefined : 'standalone',
  outputFileTracingRoot: __dirname,
  // next/image в проекте не используется; отключаем оптимизатор, иначе /_next/image
  // работает как открытый прокси для картинок с любого домена за счёт квоты Vercel
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; worker-src * blob:;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
