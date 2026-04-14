'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { YandexMap } from '@/components/map/YandexMap';
import { propertiesApi, type Property } from '@/lib/api';

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
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', overflow: 'hidden' }}>
      {/* Map */}
      <div style={{ flex: 1, padding: '1rem', position: 'relative' }}>
        {loading ? (
          <div style={{ height: '100%', background: '#E2E8F0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(15,25,35,0.4)' }}>
            Загрузка объектов…
          </div>
        ) : (
          <YandexMap properties={properties} onSelect={setSelected} />
        )}

        {/* Counter */}
        <div
          style={{
            position:   'absolute',
            top:        '1.75rem',
            left:       '1.75rem',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 10,
            padding:    '0.5rem 0.875rem',
            fontSize:   '0.8125rem',
            fontWeight: 600,
            boxShadow:  '0 2px 10px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {properties.length} ЖК на карте
        </div>
      </div>

      {/* Sidebar */}
      <div
        style={{
          width:      360,
          flexShrink: 0,
          background: '#fff',
          borderLeft: '1px solid rgba(15,25,35,0.08)',
          display:    'flex',
          flexDirection: 'column',
          overflowY:  'auto',
        }}
      >
        {selected ? (
          // Детали выбранного ЖК
          <div style={{ padding: '1.25rem' }}>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,25,35,0.45)', fontSize: '0.8125rem', marginBottom: '1rem', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Manrope, sans-serif' }}
            >
              ← Все объекты
            </button>

            {selected.images[0] && (
              <img
                src={selected.images[0].url}
                alt={selected.name}
                style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: '1rem' }}
              />
            )}

            <div style={{ fontSize: '0.75rem', color: 'rgba(15,25,35,0.45)', marginBottom: 4 }}>
              {selected.district}{selected.developer ? ` · ${selected.developer.name}` : ''}
            </div>
            <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem', lineHeight: 1.2 }}>
              {selected.name}
            </h2>

            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#2F80ED', marginBottom: '0.25rem' }}>
              от {Number(selected.priceFrom).toLocaleString('ru')} ₽
            </div>
            {selected.priceM2 && (
              <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.45)', marginBottom: '1rem' }}>
                {selected.priceM2.toLocaleString('ru')} ₽/м²
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              {[
                { label: 'Статус',  value: selected.status === 'ready' ? 'Сдан' : 'Строится' },
                { label: 'Этажей', value: selected.floors ? String(selected.floors) : '—' },
                { label: 'Площадь', value: selected.areaMin ? `${selected.areaMin}–${selected.areaMax} м²` : '—' },
                { label: 'Сдача',   value: selected.deadlineYear ? `${selected.deadlineQ ?? ''}кв ${selected.deadlineYear}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#F7F9FC', borderRadius: 8, padding: '0.625rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(15,25,35,0.4)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>

            <Link
              href={`/catalog/${selected.slug}`}
              style={{
                display:        'block',
                textAlign:      'center',
                padding:        '0.75rem',
                borderRadius:   12,
                background:     '#2F80ED',
                color:          '#fff',
                fontWeight:     700,
                textDecoration: 'none',
                fontSize:       '0.9375rem',
              }}
            >
              Подробнее о ЖК
            </Link>
          </div>
        ) : (
          // Список всех ЖК
          <div>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(15,25,35,0.08)', fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
              Все объекты
            </div>
            {properties.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                style={{
                  padding:      '1rem 1.25rem',
                  borderBottom: '1px solid rgba(15,25,35,0.05)',
                  cursor:       'pointer',
                  transition:   'background 0.15s',
                  display:      'flex',
                  gap:          '0.875rem',
                  alignItems:   'center',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F7F9FC'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div
                  style={{
                    width:          46,
                    height:         46,
                    borderRadius:   8,
                    background:     '#E2E8F0',
                    flexShrink:     0,
                    overflow:       'hidden',
                  }}
                >
                  {p.images[0] && (
                    <img src={p.images[0].url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(15,25,35,0.45)', marginTop: 2 }}>
                    {p.district}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#2F80ED', flexShrink: 0 }}>
                  {(Number(p.priceFrom) / 1_000_000).toFixed(1)} млн
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
