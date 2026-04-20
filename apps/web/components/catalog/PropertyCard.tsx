'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useTrackEvent } from '@/lib/hooks/useTrackEvent';
import { useFavoritesStore } from '@/lib/store/favorites.store';
import type { Property } from '@/lib/api';

interface Props {
  property: Property;
}

const GRADIENTS = [
  ['#dce8f5', '#b8d4ee'],
  ['#f5e6dc', '#eec8b8'],
  ['#dcf5e6', '#b8eec8'],
  ['#f5dcf5', '#eeb8ee'],
  ['#f5f5dc', '#eeeeb8'],
  ['#dce8f5', '#b8cfe8'],
];

const EMOJIS = ['🏙', '⭐', '🟢', '😊', '🚀', '🏞', '🌿', '🌅', '☀️', '👑', '🌲', '🏆'];

function gradientForId(id: number) {
  const g = GRADIENTS[id % GRADIENTS.length];
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}
function emojiForId(id: number) {
  return EMOJIS[id % EMOJIS.length];
}
function fmtMillions(n: number) {
  return (n / 1_000_000).toFixed(1) + ' млн Р';
}

export function PropertyCard({ property }: Props) {
  const track   = useTrackEvent();
  const { has, toggle, load, isLoaded } = useFavoritesStore();
  const isFav   = has(property.id);

  useEffect(() => { if (!isLoaded) load(); }, [isLoaded, load]);

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(property.id);
  };

  const handleClick = () => {
    track('VIEW_PROPERTY', {
      propertyId:   property.id,
      propertyName: property.name,
      propertySlug: property.slug,
      district:     property.district,
      priceFrom:    property.priceFrom,
    }, property.id);
  };

  const image    = property.images[0]?.url;
  const deadline = property.deadlineYear
    ? `${property.deadlineQ ? `Q${property.deadlineQ} ` : ''}${property.deadlineYear}`
    : property.status === 'ready' ? 'Сдан' : null;

  // Rooms from layouts
  const rooms = [...new Set(
    (property.layouts ?? [])
      .filter((l) => l.rooms !== null)
      .map((l) => (l.rooms === 0 ? 'studio' : String(l.rooms)))
  )].sort();

  const areaStr = property.areaMin && property.areaMax
    ? `от ${property.areaMin} до ${property.areaMax} м²`
    : property.areaMin
    ? `от ${property.areaMin} м²`
    : null;

  const devLine = [
    property.developer?.name,
    property.floors ? `${property.floors} этажей` : null,
    areaStr,
  ].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/catalog/${property.slug}`}
      onClick={handleClick}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <article
        style={{
          background:   '#fff',
          borderRadius: 20,
          border:       '1px solid rgba(15,25,35,0.08)',
          overflow:     'hidden',
          transition:   'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
          cursor:       'pointer',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform   = 'translateY(-4px)';
          el.style.boxShadow   = '0 16px 48px rgba(0,0,0,0.12)';
          el.style.borderColor = 'transparent';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform   = 'translateY(0)';
          el.style.boxShadow   = 'none';
          el.style.borderColor = 'rgba(15,25,35,0.08)';
        }}
      >
        {/* ── Image ── */}
        <div
          style={{
            width:          '100%',
            height:         200,
            background:     image ? '#E2E8F0' : gradientForId(property.id),
            position:       'relative',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            overflow:       'hidden',
          }}
        >
          {image ? (
            <img src={image} alt={property.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '3rem', opacity: 0.35 }}>{emojiForId(property.id)}</span>
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {property.isHot && (
              <span style={{ background: '#F2994A', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 5, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                🔥 Горячее
              </span>
            )}
            <span
              style={{
                background:   property.status === 'ready' ? '#27AE60' : '#2F80ED',
                color:        '#fff',
                padding:      '0.2rem 0.6rem',
                borderRadius: 5,
                fontSize:     '0.72rem',
                fontWeight:   700,
              }}
            >
              {property.status === 'ready' ? '✓ Сдан' : 'Строится'}
            </span>
          </div>

          {/* Fav button */}
          <button
            onClick={handleFav}
            style={{
              position:       'absolute',
              top:            '0.75rem',
              right:          '0.75rem',
              width:          32,
              height:         32,
              borderRadius:   '50%',
              background:     'rgba(255,255,255,0.9)',
              border:         'none',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '1rem',
              transition:     'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
          >
            {isFav ? '❤️' : '🤍'}
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(15,25,35,0.6)', fontWeight: 500, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {property.district} район
          </div>

          <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: '#0F1923', marginBottom: '0.25rem', lineHeight: 1.3 }}>
            {property.name}
          </div>

          {devLine && (
            <div style={{ fontSize: '0.8rem', color: 'rgba(15,25,35,0.6)', marginBottom: '0.9rem' }}>
              {devLine}
            </div>
          )}

          {/* Price */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2F80ED' }}>
              {fmtMillions(Number(property.priceFrom))}
              {property.priceTo && (
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'rgba(15,25,35,0.6)' }}>
                  {' – ' + fmtMillions(Number(property.priceTo))}
                </span>
              )}
            </div>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {property.priceM2 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'rgba(15,25,35,0.6)' }}>
                📐 {Number(property.priceM2).toLocaleString('ru')} ₽/м²
              </span>
            )}
            {rooms.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'rgba(15,25,35,0.6)' }}>
                🏠 {rooms.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding:        '0.75rem 1.25rem',
            borderTop:      '1px solid rgba(15,25,35,0.08)',
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.6)' }}>
            {deadline ? (
              <>Сдача: <strong style={{ color: '#0F1923' }}>{deadline}</strong></>
            ) : (
              <span>Срок не указан</span>
            )}
          </div>
          {property.priceM2 && (
            <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.6)', fontWeight: 500 }}>
              {Number(property.priceM2).toLocaleString('ru')} ₽/м²
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
