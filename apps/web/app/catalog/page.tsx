import { propertiesApi } from '@/lib/api';
import { CatalogLayout } from '@/components/catalog/CatalogLayout';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Каталог новостроек | Уфа' };

export default async function CatalogPage() {
  const data = await propertiesApi
    .list({ limit: 100, sort: 'popular' })
    .catch((err) => {
      console.error('[CatalogPage] fetch failed:', err?.message ?? err);
      return { items: [], pagination: { total: 0, page: 1, pages: 1 } };
    });

  return (
    <main>
      <CatalogLayout properties={data.items} />
    </main>
  );
}
