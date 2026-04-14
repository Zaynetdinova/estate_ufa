import { propertiesApi } from '@/lib/api';
import { PropertyCard } from '@/components/catalog/PropertyCard';
import { RequestSelectionButton } from '@/components/leads/RequestSelectionButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Каталог новостроек | Уфа' };

interface PageProps {
  searchParams: { district?: string; priceMin?: string; priceMax?: string; page?: string };
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const data = await propertiesApi.list({
    district: searchParams.district,
    priceMin: searchParams.priceMin ? Number(searchParams.priceMin) : undefined,
    priceMax: searchParams.priceMax ? Number(searchParams.priceMax) : undefined,
    page:     searchParams.page ? Number(searchParams.page) : 1,
    limit:    12,
    sort:     'popular',
  }).catch((err) => {
    console.error('[CatalogPage] fetch failed:', err?.message ?? err);
    return { items: [], pagination: { total: 0, page: 1, pages: 1 } };
  });

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>
            Новостройки Уфы
          </h1>
          <p style={{ color: 'rgba(15,25,35,0.55)', fontSize: '0.875rem' }}>
            {data.pagination.total} объектов
          </p>
        </div>
        <RequestSelectionButton source="manual" />
      </div>

      {/* Grid */}
      {data.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'rgba(15,25,35,0.45)' }}>
          Объекты не найдены
        </div>
      ) : (
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap:                 '1.25rem',
          }}
        >
          {data.items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.pagination.pages > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}`}
              style={{
                padding:      '0.5rem 0.875rem',
                borderRadius: 8,
                border:       '1.5px solid',
                borderColor:  p === data.pagination.page ? '#2F80ED' : 'rgba(15,25,35,0.12)',
                color:        p === data.pagination.page ? '#2F80ED' : '#0F1923',
                fontWeight:   p === data.pagination.page ? 700 : 400,
                textDecoration: 'none',
                fontSize:     '0.875rem',
              }}
            >
              {p}
            </a>
          ))}
        </div>
      )}

      {/* CTA Banner */}
      <div style={{ marginTop: '3rem' }}>
        <RequestSelectionButton source="manual" variant="banner" />
      </div>
    </main>
  );
}
