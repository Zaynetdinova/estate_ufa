import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { propertiesApi } from '@/lib/api';
import { PropertyDetailClient } from '@/components/catalog/PropertyDetailClient';
import type { Property } from '@/lib/api';

interface PageProps {
  params: { slug: string };
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estate-ufa.ru';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const property = await propertiesApi.bySlug(params.slug).catch(() => null);
  if (!property) return { title: 'ЖК не найден' };
  return {
    title:       `${property.name} — Новостройки Уфы`,
    description: property.description ?? `${property.name} в ${property.district}. От ${Number(property.priceFrom).toLocaleString('ru')} ₽`,
    openGraph: {
      title:       `${property.name} — Новостройки Уфы`,
      description: property.description ?? `${property.name} в ${property.district}`,
      url:         `${BASE_URL}/catalog/${property.slug}`,
      images:      property.images[0] ? [{ url: property.images[0].url }] : [],
      type:        'website',
    },
  };
}

function buildJsonLd(property: Property) {
  const price = Number(property.priceFrom);
  return {
    '@context':   'https://schema.org',
    '@type':      'RealEstateListing',
    name:         property.name,
    description:  property.description ?? undefined,
    url:          `${BASE_URL}/catalog/${property.slug}`,
    image:        property.images.map((img) => img.url),
    address: {
      '@type':          'PostalAddress',
      addressLocality:  'Уфа',
      addressRegion:    'Республика Башкортостан',
      addressCountry:   'RU',
      streetAddress:    property.address ?? property.district,
    },
    ...(property.lat && property.lng
      ? {
          geo: {
            '@type':     'GeoCoordinates',
            latitude:    property.lat,
            longitude:   property.lng,
          },
        }
      : {}),
    offers: {
      '@type':         'Offer',
      priceCurrency:   'RUB',
      price:           price,
      availability:
        property.status === 'ready'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/PreOrder',
    },
    ...(property.developer
      ? {
          seller: {
            '@type': 'Organization',
            name:    property.developer.name,
          },
        }
      : {}),
  };
}

export default async function PropertyPage({ params }: PageProps) {
  const property = await propertiesApi.bySlug(params.slug).catch(() => null);
  if (!property) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(property)) }}
      />
      <PropertyDetailClient property={property} />
    </>
  );
}
