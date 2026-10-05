const isDev = process.env.NODE_ENV !== 'production';
const isPreview = process.env.VERCEL_ENV === 'preview';

const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').origin;
  } catch {
    return '';
  }
})();

// Домены Яндекс Карт JS API 2.1 — по документации Яндекса для сайтов с CSP
const yandexMaps = {
  script:  ['https://api-maps.yandex.ru', 'https://*.api-maps.yandex.ru', 'https://suggest-maps.yandex.ru', 'https://*.maps.yandex.net', 'https://yandex.ru', 'https://yastatic.net'],
  connect: ['https://api-maps.yandex.ru', 'https://*.api-maps.yandex.ru', 'https://suggest-maps.yandex.ru', 'https://*.maps.yandex.net', 'https://yandex.ru', 'https://*.taxi.yandex.net'],
  img:     ['https://*.maps.yandex.net', 'https://api-maps.yandex.ru', 'https://*.api-maps.yandex.ru', 'https://yandex.ru'],
  frame:   ['https://api-maps.yandex.ru'],
};

// Панель комментариев Vercel на preview-деплоях
const vercelLive = isPreview ? ['https://vercel.live'] : [];

const csp = {
  'default-src': ["'self'"],
  // 'unsafe-inline' нужен для inline-скриптов Next.js (без nonce),
  // 'unsafe-eval' — требование Яндекс Карт 2.1
  'script-src':  ["'self'", "'unsafe-inline'", "'unsafe-eval'", ...yandexMaps.script, ...vercelLive],
  'style-src':   ["'self'", "'unsafe-inline'", 'blob:', 'https://fonts.googleapis.com', ...vercelLive],
  'font-src':    ["'self'", 'data:', 'https://fonts.gstatic.com', ...vercelLive],
  // Фото ЖК приходят с внешних хостингов, поэтому любые https-картинки
  'img-src':     ["'self'", 'data:', 'blob:', 'https:'],
  'connect-src': ["'self'", apiOrigin, ...yandexMaps.connect, ...vercelLive, ...(isDev ? ['ws:'] : [])],
  'frame-src':   [...yandexMaps.frame, ...vercelLive],
  'worker-src':  ["'self'", 'blob:'],
  'object-src':  ["'none'"],
  'base-uri':    ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
};

const contentSecurityPolicy = Object.entries(csp)
  .map(([directive, sources]) => [directive, ...sources.filter(Boolean)].join(' '))
  .join('; ');

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
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
