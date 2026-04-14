'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { Property } from '@/lib/api';
import { useTrackEvent } from '@/lib/hooks/useTrackEvent';
import { RequestSelectionButton } from '@/components/leads/RequestSelectionButton';

interface Props { property: Property }

export function PropertyDetailClient({ property }: Props) {
  const track = useTrackEvent();

  // VIEW_PROPERTY при монтировании (SSR уже вызвал increment, здесь — событие для n8n)
  useEffect(() => {
    track(
      'VIEW_PROPERTY',
      {
        propertyId:   property.id,
        propertyName: property.name,
        propertySlug: property.slug,
        district:     property.district,
        priceFrom:    property.priceFrom,
      },
      property.id,
    );
  }, [property.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const image     = property.images[0]?.url;
  const deadline  = property.deadlineYear
    ? `${property.deadlineQ ? `${property.deadlineQ} кв. ` : ''}${property.deadlineYear} г.`
    : 'Уточняется';

  const roomLabels: Record<number, string> = { 0: 'Студия', 1: '1-комн.', 2: '2-комн.', 3: '3-комн.', 4: '4+-комн.' };

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.8rem', color: 'rgba(15,25,35,0.45)', marginBottom: '1.25rem', display: 'flex', gap: 6, alignItems: 'center' }}>
        <Link href="/"       style={{ color: 'inherit', textDecoration: 'none' }}>Главная</Link>
        <span>›</span>
        <Link href="/catalog" style={{ color: 'inherit', textDecoration: 'none' }}>Каталог</Link>
        <span>›</span>
        <span style={{ color: '#0F1923' }}>{property.name}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.75rem', alignItems: 'start' }}>

        {/* Left */}
        <div>
          {/* Gallery */}
          <div style={{ borderRadius: 16, overflow: 'hidden', background: '#E2E8F0', marginBottom: '1.5rem', position: 'relative' }}>
            {image ? (
              <img src={image} alt={property.name} style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'rgba(15,25,35,0.2)' }}>🏢</div>
            )}
            {property.isHot && (
              <span style={{ position: 'absolute', top: 16, left: 16, background: '#F2994A', color: '#fff', padding: '5px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem' }}>
                ХИТ ПРОДАЖ
              </span>
            )}
          </div>

          {/* Image strip */}
          {property.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
              {property.images.slice(1, 6).map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.alt ?? ''}
                  style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 8, flexShrink: 0, cursor: 'pointer' }}
                />
              ))}
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(15,25,35,0.08)', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '0.875rem' }}>
                О жилом комплексе
              </h2>
              <p style={{ lineHeight: 1.7, color: 'rgba(15,25,35,0.7)', fontSize: '0.9375rem' }}>
                {property.description}
              </p>
            </div>
          )}

          {/* Layouts */}
          {property.layouts.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(15,25,35,0.08)' }}>
              <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                Планировки
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.875rem' }}>
                {property.layouts.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      border:       '1.5px solid rgba(15,25,35,0.08)',
                      borderRadius: 12,
                      padding:      '1rem',
                      textAlign:    'center',
                    }}
                  >
                    {l.imageUrl && (
                      <img src={l.imageUrl} alt="" style={{ width: '100%', height: 100, objectFit: 'contain', marginBottom: 8 }} />
                    )}
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
                      {l.rooms !== null ? (roomLabels[l.rooms] ?? `${l.rooms}-комн.`) : '—'}
                    </div>
                    {(l.areaMin || l.areaMax) && (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(15,25,35,0.55)', marginBottom: 4 }}>
                        {l.areaMin}–{l.areaMax} м²
                      </div>
                    )}
                    {l.priceFrom && (
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2F80ED' }}>
                        от {Number(l.priceFrom).toLocaleString('ru')} ₽
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(15,25,35,0.08)' }}>
            <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.45)', marginBottom: 4 }}>
              {property.district}{property.developer ? ` · ${property.developer.name}` : ''}
            </div>
            <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '1rem' }}>
              {property.name}
            </h1>

            <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#2F80ED', marginBottom: 4 }}>
              от {Number(property.priceFrom).toLocaleString('ru')} ₽
            </div>
            {property.priceM2 && (
              <div style={{ fontSize: '0.8rem', color: 'rgba(15,25,35,0.45)', marginBottom: '1.25rem' }}>
                {property.priceM2.toLocaleString('ru')} ₽/м²
              </div>
            )}

            {/* Характеристики */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Район',   value: property.district },
                { label: 'Статус',  value: property.status === 'ready' ? 'Сдан' : 'Строится' },
                { label: 'Сдача',   value: deadline },
                { label: 'Этажей', value: property.floors ? String(property.floors) : '—' },
                { label: 'Площадь', value: property.areaMin && property.areaMax ? `${property.areaMin}–${property.areaMax} м²` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#F7F9FC', borderRadius: 8, padding: '0.625rem 0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(15,25,35,0.45)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F1923' }}>{value}</div>
                </div>
              ))}
            </div>

            <RequestSelectionButton source="manual" />

            <Link
              href="/chat"
              style={{
                display:        'block',
                textAlign:      'center',
                marginTop:      '0.625rem',
                padding:        '0.7rem',
                borderRadius:   12,
                border:         '1.5px solid rgba(15,25,35,0.15)',
                color:          '#0F1923',
                fontWeight:     600,
                fontSize:       '0.875rem',
                textDecoration: 'none',
              }}
            >
              Задать вопрос AI
            </Link>
          </div>

          {/* Calculator shortcut */}
          <Link
            href={`/calculator?propertyId=${property.id}&price=${property.priceFrom}`}
            style={{
              display:        'block',
              background:     '#fff',
              borderRadius:   16,
              padding:        '1.125rem 1.25rem',
              border:         '1.5px solid rgba(47,128,237,0.2)',
              textDecoration: 'none',
              color:          '#0F1923',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🧮</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Рассчитать доходность</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.5)', marginTop: 2 }}>
                  Калькулятор инвестиций
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
