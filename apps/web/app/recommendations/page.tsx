'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { recommendationsApi, type RecommendationResult } from '@/lib/api';
import { RequestSelectionButton } from '@/components/leads/RequestSelectionButton';

export default function RecommendationsPage() {
  const [data, setData]       = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationsApi
      .get()
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1
        style={{
          fontFamily:   'Unbounded, sans-serif',
          fontSize:     '1.5rem',
          fontWeight:   700,
          marginBottom: '0.5rem',
        }}
      >
        Подборка для вас
      </h1>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height:       110,
                borderRadius: 16,
                background:   'linear-gradient(90deg, #E2E8F0 25%, #F7F9FC 50%, #E2E8F0 75%)',
                backgroundSize: '400% 100%',
                animation:    'shimmer 1.5s infinite',
              }}
            />
          ))}
          <style>{`@keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }`}</style>
        </div>
      )}

      {data && !loading && (
        <>
          {data.source === 'ai' && (
            <p
              style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          6,
                background:   '#EBF4FF',
                color:        '#2F80ED',
                borderRadius: 8,
                padding:      '4px 10px',
                fontSize:     '0.8rem',
                fontWeight:   600,
                marginBottom: '1rem',
              }}
            >
              ✦ AI-подборка на основе вашего профиля
            </p>
          )}

          {data.summary && (
            <p style={{ color: 'rgba(15,25,35,0.6)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
              {data.summary}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {data.properties.map((prop) => (
              <Link
                key={prop.id}
                href={`/catalog/${prop.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  style={{
                    background:   '#fff',
                    borderRadius: 16,
                    border:       '1px solid rgba(15,25,35,0.08)',
                    padding:      '1.25rem',
                    display:      'flex',
                    justifyContent: 'space-between',
                    alignItems:   'center',
                    gap:          '1rem',
                    transition:   'box-shadow 0.2s',
                    cursor:       'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                      {prop.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(15,25,35,0.5)', marginBottom: 8 }}>
                      {prop.district}
                    </div>
                    <div
                      style={{
                        display:      'inline-block',
                        background:   'rgba(47,128,237,0.08)',
                        color:        '#2F80ED',
                        borderRadius: 8,
                        padding:      '3px 8px',
                        fontSize:     '0.78rem',
                        fontWeight:   500,
                      }}
                    >
                      {prop.reason}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2F80ED' }}>
                      от {Number(prop.priceFrom).toLocaleString('ru')} ₽
                    </div>
                    {prop.priceM2 && (
                      <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.45)', marginTop: 2 }}>
                        {prop.priceM2.toLocaleString('ru')} ₽/м²
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <RequestSelectionButton source="manual" variant="banner" />
          </div>
        </>
      )}
    </main>
  );
}
