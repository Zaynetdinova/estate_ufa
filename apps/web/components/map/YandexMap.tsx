'use client';

import { useEffect, useRef, useState } from 'react';
import type { Property } from '@/lib/api';

interface Props {
  properties: Property[];
  onSelect?:  (property: Property) => void;
}

// Глобальный тип для Яндекс Карт
declare global {
  interface Window {
    ymaps3: any;
  }
}

export function YandexMap({ properties, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const markersRef   = useRef<any[]>([]);
  const [loaded,     setLoaded] = useState(false);
  const [error,      setError]  = useState('');

  // Загружаем Яндекс Карты JS API 3.0
  useEffect(() => {
    if (window.ymaps3) { setLoaded(true); return; }

    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY ?? '';

    const script    = document.createElement('script');
    script.src      = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`;
    script.async    = true;
    script.onload   = () => {
      window.ymaps3.ready.then(() => setLoaded(true));
    };
    script.onerror  = () => setError('Не удалось загрузить Яндекс Карты');
    document.head.appendChild(script);

    return () => { document.head.removeChild(script); };
  }, []);

  // Инициализируем карту
  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = window.ymaps3;

    mapRef.current = new YMap(containerRef.current, {
      location: {
        center: [55.9578, 54.7388], // Уфа [lng, lat]
        zoom:   11,
      },
    });

    mapRef.current.addChild(new YMapDefaultSchemeLayer());
    mapRef.current.addChild(new YMapDefaultFeaturesLayer());

    return () => {
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [loaded]);

  // Добавляем маркеры
  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    const { YMapMarker } = window.ymaps3;

    // Убираем старые маркеры
    markersRef.current.forEach((m) => mapRef.current?.removeChild(m));
    markersRef.current = [];

    properties.forEach((p) => {
      if (!p.lat || !p.lng) return;

      // Создаём DOM-элемент маркера
      const el       = document.createElement('div');
      el.style.cssText = `
        background: ${p.isHot ? '#F2994A' : '#2F80ED'};
        color: #fff;
        padding: 4px 10px;
        border-radius: 20px;
        font-family: Manrope, sans-serif;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transform: translateY(-50%);
        transition: transform 0.15s, box-shadow 0.15s;
      `;
      el.textContent = `от ${(Number(p.priceFrom) / 1_000_000).toFixed(1)} млн`;
      el.title       = p.name;

      el.addEventListener('mouseenter', () => {
        el.style.transform  = 'translateY(-50%) scale(1.08)';
        el.style.boxShadow  = '0 4px 16px rgba(0,0,0,0.25)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform  = 'translateY(-50%)';
        el.style.boxShadow  = '0 2px 8px rgba(0,0,0,0.2)';
      });
      el.addEventListener('click', () => onSelect?.(p));

      const marker = new YMapMarker(
        { coordinates: [p.lng, p.lat] },
        el,
      );

      mapRef.current.addChild(marker);
      markersRef.current.push(marker);
    });
  }, [loaded, properties, onSelect]);

  if (error) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F9FC', borderRadius: 16, color: 'rgba(15,25,35,0.5)' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', borderRadius: 16, overflow: 'hidden' }}>
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E2E8F0', zIndex: 1 }}>
          <div style={{ color: 'rgba(15,25,35,0.4)', fontSize: '0.875rem' }}>Загрузка карты…</div>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
