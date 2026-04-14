import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estate-ufa.ru';
const API_URL  = process.env.NEXT_PUBLIC_API_URL  ?? 'http://localhost:4000';

interface PropertySlug {
  slug:      string;
  updatedAt: string;
}

async function getPropertySlugs(): Promise<PropertySlug[]> {
  try {
    const res = await fetch(`${API_URL}/properties/slugs`, {
      next: { revalidate: 3600 }, // обновляем раз в час
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getPropertySlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url:              `${BASE_URL}/`,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         1.0,
    },
    {
      url:              `${BASE_URL}/catalog`,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         0.9,
    },
    {
      url:              `${BASE_URL}/map`,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         0.7,
    },
    {
      url:              `${BASE_URL}/calculator`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.6,
    },
  ];

  const propertyRoutes: MetadataRoute.Sitemap = properties.map((p) => ({
    url:             `${BASE_URL}/catalog/${p.slug}`,
    lastModified:    new Date(p.updatedAt),
    changeFrequency: 'weekly' as const,
    priority:        0.8,
  }));

  return [...staticRoutes, ...propertyRoutes];
}
