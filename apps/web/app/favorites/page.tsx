'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/catalog/PropertyCard';
import type { Property } from '@/lib/api';

export default function FavoritesPage() {
  const [favorites,  setFavorites]  = useState<{ property: Property }[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loggedIn,   setLoggedIn]   = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); setLoggedIn(false); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setFavorites)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.3rem', fontWeight: 700 }}>
          ❤️ Избранное
        </h1>
      </div>

      {loading && (
        <div style={{ color: 'rgba(15,25,35,0.4)', padding: '4rem 0', textAlign: 'center' }}>Загрузка…</div>
      )}

      {!loading && !loggedIn && (
        <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>🔐</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Войдите, чтобы увидеть избранное</h3>
          <p style={{ color: 'rgba(15,25,35,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Избранное сохраняется для зарегистрированных пользователей
          </p>
          <Link
            href="/auth/login"
            style={{
              padding: '0.75rem 1.5rem', borderRadius: 12,
              background: '#2F80ED', color: '#fff',
              fontWeight: 700, textDecoration: 'none',
            }}
          >
            Войти
          </Link>
        </div>
      )}

      {!loading && loggedIn && favorites.length === 0 && (
        <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>🏠</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Нет избранных объектов</h3>
          <p style={{ color: 'rgba(15,25,35,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Добавляйте ЖК в избранное, нажимая на ❤️ на карточке
          </p>
          <Link
            href="/catalog"
            style={{
              padding: '0.75rem 1.5rem', borderRadius: 12,
              background: '#2F80ED', color: '#fff',
              fontWeight: 700, textDecoration: 'none',
            }}
          >
            Перейти в каталог
          </Link>
        </div>
      )}

      {!loading && favorites.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {favorites.map(({ property }) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </main>
  );
}
