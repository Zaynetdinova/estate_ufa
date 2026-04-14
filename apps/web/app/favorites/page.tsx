'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/catalog/PropertyCard';
import type { Property } from '@/lib/api';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<{ property: Property }[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setFavorites)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Избранное
      </h1>

      {loading && (
        <div style={{ color: 'rgba(15,25,35,0.4)', padding: '4rem 0', textAlign: 'center' }}>
          Загрузка…
        </div>
      )}

      {!loading && favorites.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❤️</div>
          <p style={{ color: 'rgba(15,25,35,0.5)', marginBottom: '1.5rem' }}>
            Вы ещё не добавили ни одного ЖК
          </p>
          <Link
            href="/catalog"
            style={{
              padding:        '0.75rem 1.5rem',
              borderRadius:   12,
              background:     '#2F80ED',
              color:          '#fff',
              fontWeight:     700,
              textDecoration: 'none',
            }}
          >
            Перейти в каталог
          </Link>
        </div>
      )}

      {!loading && favorites.length > 0 && (
        <>
          <p style={{ color: 'rgba(15,25,35,0.5)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {favorites.length} {favorites.length === 1 ? 'объект' : favorites.length < 5 ? 'объекта' : 'объектов'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {favorites.map(({ property }) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
