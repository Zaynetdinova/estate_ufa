'use client';

import { useState, useMemo, useRef } from 'react';
import type { Property } from '@/lib/api';
import { PropertyCard } from './PropertyCard';

interface Props {
  properties: Property[];
}

interface Filters {
  district:  string;
  deadline:  string;
  priceMin:  string;
  priceMax:  string;
  rooms:     string;
}

const DISTRICTS = ['Кировский', 'Ленинский', 'Октябрьский', 'Орджоникидзевский', 'Советский'];

const DEADLINE_OPTIONS = [
  { val: '2025', label: '2025' },
  { val: '2026', label: '2026' },
  { val: '2027', label: '2027+' },
  { val: 'ready', label: 'Сдан' },
];

const SORT_OPTIONS = [
  { val: 'popular',    label: 'По популярности' },
  { val: 'price-asc',  label: 'Цена ↑' },
  { val: 'price-desc', label: 'Цена ↓' },
  { val: 'deadline',   label: 'По сроку сдачи' },
];

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.35rem 0.8rem', borderRadius: 6,
    fontSize: '0.8rem', fontWeight: 500,
    color: active ? '#2F80ED' : 'rgba(15,25,35,0.6)',
    border: `1.5px solid ${active ? '#2F80ED' : 'rgba(15,25,35,0.08)'}`,
    background: active ? '#EBF4FF' : 'none',
    cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: 'Manrope, sans-serif',
  };
}

export function CatalogLayout({ properties }: Props) {
  const catalogRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<Filters>({ district: '', deadline: '', priceMin: '', priceMax: '', rooms: '' });
  const [sortBy,  setSortBy]  = useState('popular');

  // Hero search form state
  const [hsDistrict, setHsDistrict] = useState('');
  const [hsRooms,    setHsRooms]    = useState('');
  const [hsPriceMin, setHsPriceMin] = useState('');
  const [hsPriceMax, setHsPriceMax] = useState('');

  const setFilter = (key: keyof Filters, val: string) =>
    setFilters((prev) => ({ ...prev, [key]: prev[key] === val ? '' : val }));

  const applyHeroSearch = () => {
    setFilters((prev) => ({
      ...prev,
      district: hsDistrict,
      rooms:    hsRooms,
      priceMin: hsPriceMin,
      priceMax: hsPriceMax,
    }));
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filtered = useMemo(() => {
    let list = [...properties];
    if (filters.district) list = list.filter((p) => p.district === filters.district);
    if (filters.deadline) {
      if (filters.deadline === 'ready') list = list.filter((p) => p.status === 'ready');
      else if (filters.deadline === '2027') list = list.filter((p) => p.deadlineYear != null && p.deadlineYear >= 2027);
      else list = list.filter((p) => String(p.deadlineYear) === filters.deadline);
    }
    if (filters.priceMin) list = list.filter((p) => Number(p.priceFrom) >= Number(filters.priceMin));
    if (filters.priceMax) list = list.filter((p) => Number(p.priceFrom) <= Number(filters.priceMax));
    if (filters.rooms === 'studio') list = list.filter((p) => (p.layouts ?? []).some((l) => l.rooms === 0));
    else if (filters.rooms === '3+') list = list.filter((p) => (p.layouts ?? []).some((l) => l.rooms != null && l.rooms >= 3));
    else if (filters.rooms) list = list.filter((p) => (p.layouts ?? []).some((l) => l.rooms === Number(filters.rooms)));
    if (sortBy === 'price-asc')  list.sort((a, b) => Number(a.priceFrom) - Number(b.priceFrom));
    if (sortBy === 'price-desc') list.sort((a, b) => Number(b.priceFrom) - Number(a.priceFrom));
    if (sortBy === 'deadline')   list.sort((a, b) => (a.deadlineYear ?? 9999) - (b.deadlineYear ?? 9999));
    if (sortBy === 'popular')    list.sort((a, b) => (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0));
    return list;
  }, [properties, filters, sortBy]);

  const resetFilters = () => setFilters({ district: '', deadline: '', priceMin: '', priceMax: '', rooms: '' });

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff', padding: '0.65rem 0.9rem', borderRadius: 8,
    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
    outline: 'none', appearance: 'none', width: '100%', boxSizing: 'border-box',
  };
  const heroInputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff', padding: '0.65rem 0.9rem', borderRadius: 8,
    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <>
      {/* ══════════════ HERO ══════════════ */}
      <style>{`.hero-input::placeholder { color: rgba(255,255,255,0.35); }`}</style>
      <section style={{ background: 'linear-gradient(135deg, #0F1923 0%, #1a2a3a 100%)', padding: '4rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 70% 50%, rgba(47,128,237,0.18), transparent)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', position: 'relative' }}>
          {/* Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(47,128,237,0.2)', border: '1px solid rgba(47,128,237,0.4)', color: '#7bb8f7', padding: '4px 14px', borderRadius: 32, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              🏙 Уфа · 2025
            </div>
            <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', color: '#fff', lineHeight: 1.15, marginBottom: '1.25rem', fontWeight: 700 }}>
              Найди свою<br />
              <span style={{ color: '#2F80ED' }}>новостройку</span><br />
              в Уфе
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2.5rem', fontWeight: 300 }}>
              Все жилые комплексы города в одном месте. Удобная фильтрация, честная аналитика и AI-консультант для умного выбора.
            </p>
            <div style={{ display: 'flex', gap: '2.5rem' }}>
              {[
                { num: `${properties.length || '40'}+`, label: 'ЖК в продаже' },
                { num: '18',     label: 'Застройщиков' },
                { num: '8 500+', label: 'Квартир' },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.6rem', color: '#fff', fontWeight: 700 }}>{num}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — search card */}
          <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '2rem' }}>
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '1.5rem', fontSize: '1rem' }}>Быстрый поиск</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Район</label>
                <select value={hsDistrict} onChange={(e) => setHsDistrict(e.target.value)} style={selectStyle}>
                  <option value="" style={{ background: '#1a2a3a' }}>Все районы</option>
                  {DISTRICTS.map((d) => <option key={d} value={d} style={{ background: '#1a2a3a' }}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Комнат</label>
                <select value={hsRooms} onChange={(e) => setHsRooms(e.target.value)} style={selectStyle}>
                  <option value=""       style={{ background: '#1a2a3a' }}>Любое</option>
                  <option value="studio" style={{ background: '#1a2a3a' }}>Студия</option>
                  <option value="1"      style={{ background: '#1a2a3a' }}>1</option>
                  <option value="2"      style={{ background: '#1a2a3a' }}>2</option>
                  <option value="3+"     style={{ background: '#1a2a3a' }}>3+</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Цена от, ₽</label>
                <input
                  type="text" inputMode="numeric" placeholder="3 000 000"
                  value={hsPriceMin}
                  onChange={(e) => setHsPriceMin(e.target.value.replace(/\D/g, ''))}
                  className="hero-input"
                  style={heroInputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Цена до, ₽</label>
                <input
                  type="text" inputMode="numeric" placeholder="12 000 000"
                  value={hsPriceMax}
                  onChange={(e) => setHsPriceMax(e.target.value.replace(/\D/g, ''))}
                  className="hero-input"
                  style={heroInputStyle}
                />
              </div>
            </div>

            <button
              onClick={applyHeroSearch}
              style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', borderRadius: 8, border: 'none', background: '#2F80ED', color: '#fff', fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', boxShadow: '0 2px 12px rgba(47,128,237,0.35)' }}
            >
              🔍 Найти квартиры
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════ CATALOG ══════════════ */}
      <div
        ref={catalogRef}
        style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.75rem', alignItems: 'start' }}
      >
        {/* ── Sidebar ── */}
        <aside style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(15,25,35,0.08)', padding: '1.5rem', position: 'sticky', top: 80 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(15,25,35,0.6)', marginBottom: '1.5rem' }}>
            Фильтры
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F1923', marginBottom: '0.75rem' }}>Район</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <button style={chipStyle(filters.district === '')} onClick={() => setFilters((p) => ({ ...p, district: '' }))}>Все</button>
              {DISTRICTS.map((d) => (
                <button key={d} style={chipStyle(filters.district === d)} onClick={() => setFilter('district', d)}>{d}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F1923', marginBottom: '0.75rem' }}>Комнатность</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[
                { label: 'Все',      val: '' },
                { label: 'Студия',   val: 'studio' },
                { label: '1-комн.',  val: '1' },
                { label: '2-комн.',  val: '2' },
                { label: '3-комн.+', val: '3+' },
              ].map(({ label, val }) => (
                <button
                  key={val}
                  style={chipStyle(filters.rooms === val)}
                  onClick={() => setFilters((p) => ({ ...p, rooms: p.rooms === val ? '' : val }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F1923', marginBottom: '0.75rem' }}>Срок сдачи</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <button style={chipStyle(filters.deadline === '')} onClick={() => setFilters((p) => ({ ...p, deadline: '' }))}>Все</button>
              {DEADLINE_OPTIONS.map(({ val, label }) => (
                <button key={val} style={chipStyle(filters.deadline === val)} onClick={() => setFilter('deadline', val)}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F1923', marginBottom: '0.75rem' }}>Цена (₽)</div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number" placeholder="от 3 млн" value={filters.priceMin}
                onChange={(e) => setFilters((p) => ({ ...p, priceMin: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid rgba(15,25,35,0.08)', borderRadius: 8, fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: '#0F1923', outline: 'none' }}
              />
              <span style={{ color: 'rgba(15,25,35,0.3)', fontSize: '0.85rem', flexShrink: 0 }}>—</span>
              <input
                type="number" placeholder="до 15 млн" value={filters.priceMax}
                onChange={(e) => setFilters((p) => ({ ...p, priceMax: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid rgba(15,25,35,0.08)', borderRadius: 8, fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: '#0F1923', outline: 'none' }}
              />
            </div>
          </div>

          <button
            onClick={resetFilters}
            style={{ width: '100%', padding: '0.6rem', borderRadius: 8, background: 'none', border: '1.5px solid rgba(15,25,35,0.08)', fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(15,25,35,0.6)', cursor: 'pointer' }}
          >
            ✕ Сбросить фильтры
          </button>
        </aside>

        {/* ── Grid ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'rgba(15,25,35,0.6)' }}>
              Найдено: <strong style={{ color: '#0F1923', fontWeight: 700 }}>{filtered.length}</strong> ЖК
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'rgba(15,25,35,0.6)' }}>Сортировка:</span>
              <select
                value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', border: '1.5px solid rgba(15,25,35,0.08)', borderRadius: 8, fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: '#0F1923', background: '#fff', outline: 'none', cursor: 'pointer' }}
              >
                {SORT_OPTIONS.map(({ val, label }) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'rgba(15,25,35,0.45)' }}>Объекты не найдены</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {filtered.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
