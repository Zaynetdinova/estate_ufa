'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { YandexMap } from '@/components/map/YandexMap';
import { propertiesApi, type Property } from '@/lib/api';

function fmtMln(n: number) {
  return (n / 1_000_000).toFixed(1) + ' млн Р';
}

export default function MapPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selected,   setSelected]   = useState<Property | null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    propertiesApi
      .list({ limit: 100 })
      .then((d) => setProperties(d.items))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'grid', gridTemplateColumns: '360px 1fr', overflow: 'hidden' }}>

      {/* ── Left list ── */}
      <div style={{ overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#F7F9FC' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(15,25,35,0.4)', fontSize: '0.875rem' }}>Загрузка…</div>
        )}

        {selected && (
          <button
            onClick={() => setSelected(null)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(15,25,35,0.55)', fontSize: '0.8125rem',
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'Manrope, sans-serif', padding: '0.25rem 0',
            }}
          >
            ← Все объекты
          </button>
        )}

        {(selected ? [selected] : properties).map((p) => (
          <div
            key={p.id}
            onClick={() => setSelected(p)}
            style={{
              background:   '#fff',
              borderRadius: 12,
              border:       `1px solid ${selected?.id === p.id ? '#2F80ED' : 'rgba(15,25,35,0.08)'}`,
              padding:      '1rem',
              cursor:       'pointer',
              transition:   'all 0.2s',
              boxShadow:    selected?.id === p.id ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (selected?.id !== p.id) {
                (e.currentTarget as HTMLElement).style.borderColor = '#2F80ED';
                (e.currentTarget as HTMLElement).style.boxShadow  = '0 4px 20px rgba(0,0,0,0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (selected?.id !== p.id) {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(15,25,35,0.08)';
                (e.currentTarget as HTMLElement).style.boxShadow  = 'none';
              }
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              {p.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.6)', marginBottom: '0.5rem' }}>
              {p.district} · {p.deadlineYear
                ? (p.status === 'ready' ? 'Сдан' : `Q${p.deadlineQ ?? ''} ${p.deadlineYear}`)
                : (p.status === 'ready' ? 'Сдан' : 'В продаже')}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2F80ED', marginBottom: selected?.id === p.id ? '0.75rem' : 0 }}>
              {fmtMln(Number(p.priceFrom))}
              {p.priceTo ? ` – ${fmtMln(Number(p.priceTo))}` : ''}
            </div>

            {selected?.id === p.id && (
              <Link
                href={`/catalog/${p.slug}`}
                style={{
                  display: 'block', textAlign: 'center', padding: '0.6rem',
                  borderRadius: 8, background: '#2F80ED', color: '#fff',
                  fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem',
                }}
              >
                Подробнее →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* ── Map ── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: '100%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(15,25,35,0.4)' }}>
            Загрузка объектов…
          </div>
        ) : (
          <YandexMap properties={properties} onSelect={setSelected} />
        )}
      </div>
    </div>
  );
}
