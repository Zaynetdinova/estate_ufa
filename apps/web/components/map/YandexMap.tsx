'use client';

import { useEffect, useRef, useState } from 'react';
import type { Property } from '@/lib/api';

interface Props {
  properties: Property[];
  onSelect?:  (property: Property) => void;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export function YandexMap({ properties, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const [error,      setError] = useState('');

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY ?? '';

    const initMap = () => {
      window.ymaps.ready(() => {
        if (!containerRef.current) return;

        // Уничтожаем предыдущую карту если была
        if (mapRef.current) {
          mapRef.current.destroy();
          mapRef.current = null;
        }

        const map = new window.ymaps.Map(containerRef.current, {
          center: [54.7388, 55.9578], // Уфа [lat, lng]
          zoom:   11,
          controls: ['zoomControl', 'fullscreenControl'],
        });

        mapRef.current = map;

        // Добавляем метки
        properties.forEach((p) => {
          if (!p.lat || !p.lng) return;

          const placemark = new window.ymaps.Placemark(
            [Number(p.lat), Number(p.lng)],
            {
              balloonContentHeader: p.name,
              balloonContentBody:   `
                <div style="font-family: sans-serif; min-width: 180px;">
                  <div style="color: #666; font-size: 12px; margin-bottom: 4px">${p.district}</div>
                  <div style="color: #2F80ED; font-weight: 700; font-size: 16px;">
                    от ${(Number(p.priceFrom) / 1_000_000).toFixed(1)} млн ₽
                  </div>
                  ${p.priceM2 ? `<div style="color: #999; font-size: 12px">${Number(p.priceM2).toLocaleString('ru')} ₽/м²</div>` : ''}
                </div>
              `,
              hintContent: p.name,
            },
            {
              preset: p.isHot ? 'islands#orangeStretchyIcon' : 'islands#blueStretchyIcon',
              iconContent: `от ${(Number(p.priceFrom) / 1_000_000).toFixed(1)} млн`,
            },
          );

          placemark.events.add('click', () => onSelect?.(p));
          map.geoObjects.add(placemark);
        });
      });
    };

    // Если уже загружено
    if (window.ymaps) {
      initMap();
      return;
    }

    // Загружаем скрипт
    if (document.querySelector('#ymaps-script')) {
      // Скрипт уже добавлен, ждём загрузки
      const interval = setInterval(() => {
        if (window.ymaps) { clearInterval(interval); initMap(); }
      }, 100);
      return;
    }

    const script    = document.createElement('script');
    script.id       = 'ymaps-script';
    script.src      = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async    = true;
    script.onload   = initMap;
    script.onerror  = () => setError('Не удалось загрузить Яндекс Карты');
    document.head.appendChild(script);

    return () => {
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [properties]);

  if (error) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F9FC', borderRadius: 16, color: 'rgba(15,25,35,0.5)' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', borderRadius: 16, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
