import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estate-ufa.ru';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  [
          '/admin/',
          '/api/',
          '/auth/',
          '/favorites',
          '/chat',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
