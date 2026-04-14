'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useTrackEvent } from '@/lib/hooks/useTrackEvent';
import { useFavoritesStore } from '@/lib/store/favorites.store';
import type { Property } from '@/lib/api';

interface Props {
  property: Property;
}

export function PropertyCard({ property }: Props) {
  const track      = useTrackEvent();
  const { has, toggle, load, isLoaded } = useFavoritesStore();
  const isFav      = has(property.id);

  useEffect(() => { if (!isLoaded) load(); }, [isLoaded, load]);

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(property.id);
  };

  const handleClick = () => {
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
  };

  const image = property.images[0]?.url;
  const deadline = property.deadlineYear
    ? `${property.deadlineQ ? `${property.deadlineQ} кв. ` : ''}${property.deadlineYear}`
    : null;

  return (
    <Link
      href={`/catalog/${property.slug}`}
      onClick={handleClick}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <article
        style={{
          background:   '#fff',
          borderRadius: 16,
          border:       '1px solid rgba(15,25,35,0.08)',
          overflow:     'hidden',
          transition:   'transform 0.2s, box-shadow 0.2s',
          cursor:       'pointer',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform   = 'translateY(-3px)';
          (e.currentTarget as HTMLElement).style.boxShadow  = '0 12px 32px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform   = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow  = 'none';
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: 200, background: '#E2E8F0', overflow: 'hidden' }}>
          {image ? (
            <img
              src={image}
              alt={property.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                height:         '100%',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          'rgba(15,25,35,0.3)',
                fontSize:       '2rem',
              }}
            >
              🏢
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={handleFav}
            style={{
              position:       'absolute',
              top:            10,
              right:          10,
              width:          34,
              height:         34,
              borderRadius:   '50%',
              background:     isFav ? '#EB5757' : 'rgba(255,255,255,0.85)',
              border:         'none',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition:     'all 0.2s',
              boxShadow:      '0 2px 8px rgba(0,0,0,0.15)',
            }}
            aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? '#fff' : 'none'} stroke={isFav ? '#fff' : '#EB5757'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          {/* Badges */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
            {property.isHot && (
              <span
                style={{
                  background:   '#F2994A',
                  color:        '#fff',
                  padding:      '3px 8px',
                  borderRadius: 6,
                  fontSize:     '0.72rem',
                  fontWeight:   700,
                  letterSpacing: '0.04em',
                }}
              >
                ХИТ
              </span>
            )}
            <span
              style={{
                background:   property.status === 'ready' ? '#27AE60' : 'rgba(15,25,35,0.7)',
                color:        '#fff',
                padding:      '3px 8px',
                borderRadius: 6,
                fontSize:     '0.72rem',
                fontWeight:   600,
              }}
            >
              {property.status === 'ready' ? 'Сдан' : 'Строится'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.45)', marginBottom: '0.25rem' }}>
            {property.district}
            {property.developer && ` · ${property.developer.name}`}
          </div>

          <div
            style={{
              fontFamily:   'Unbounded, sans-serif',
              fontWeight:   700,
              fontSize:     '1rem',
              color:        '#0F1923',
              marginBottom: '0.75rem',
              lineHeight:   1.3,
            }}
          >
            {property.name}
          </div>

          {/* Price */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2F80ED' }}>
              от {Number(property.priceFrom).toLocaleString('ru')} ₽
            </div>
            {property.priceM2 && (
              <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.45)', marginTop: 2 }}>
                {property.priceM2.toLocaleString('ru')} ₽/м²
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              borderTop:      '1px solid rgba(15,25,35,0.06)',
              paddingTop:     '0.75rem',
              fontSize:       '0.8125rem',
            }}
          >
            <span style={{ color: 'rgba(15,25,35,0.55)' }}>
              {property.areaMin && property.areaMax
                ? `${property.areaMin}–${property.areaMax} м²`
                : property.floors
                ? `${property.floors} эт.`
                : null}
            </span>
            {deadline && (
              <span style={{ color: 'rgba(15,25,35,0.45)' }}>
                Сдача {deadline}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
