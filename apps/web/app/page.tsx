import Link from 'next/link';
import { propertiesApi } from '@/lib/api';
import { PropertyCard } from '@/components/catalog/PropertyCard';
import { RequestSelectionButton } from '@/components/leads/RequestSelectionButton';

export default async function HomePage() {
  const hotProperties = await propertiesApi
    .list({ isHot: true, limit: 3, sort: 'popular' })
    .catch(() => ({ items: [] }));

  return (
    <main>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0F1923 0%, #1a2a3a 100%)',
          padding:    'clamp(3rem, 6vw, 5rem) 1.5rem',
          position:   'relative',
          overflow:   'hidden',
        }}
      >
        {/* ambient glow */}
        <div
          style={{
            position:         'absolute',
            inset:            0,
            background:       'radial-gradient(ellipse 60% 80% at 70% 50%, rgba(47,128,237,0.15), transparent)',
            pointerEvents:    'none',
          }}
        />

        <div
          style={{
            maxWidth:              1400,
            margin:                '0 auto',
            display:               'grid',
            gridTemplateColumns:   'repeat(auto-fit, minmax(300px, 1fr))',
            gap:                   '3rem',
            alignItems:            'center',
            position:              'relative',
          }}
        >
          {/* Left */}
          <div>
            <div
              style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          6,
                background:   'rgba(47,128,237,0.2)',
                border:       '1px solid rgba(47,128,237,0.4)',
                color:        '#7bb8f7',
                padding:      '4px 12px',
                borderRadius: 20,
                fontSize:     '0.72rem',
                fontWeight:   700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#27AE60' }} />
              AI-платформа · Уфа
            </div>

            <h1
              style={{
                fontFamily:   'Unbounded, sans-serif',
                fontSize:     'clamp(1.75rem, 3.5vw, 2.75rem)',
                color:        '#fff',
                lineHeight:   1.15,
                marginBottom: '1.25rem',
                fontWeight:   700,
              }}
            >
              Найди квартиру<br />
              <span style={{ color: '#2F80ED' }}>в новостройке</span> Уфы
            </h1>

            <p
              style={{
                color:        'rgba(255,255,255,0.6)',
                fontSize:     '1.05rem',
                lineHeight:   1.7,
                marginBottom: '2rem',
                fontWeight:   300,
                maxWidth:     480,
              }}
            >
              AI-консультант подберёт варианты под ваш бюджет и пожелания.
              Каталог, калькулятор инвестиций и персональные рекомендации.
            </p>

            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
              <Link
                href="/chat"
                style={{
                  padding:        '0.75rem 1.5rem',
                  borderRadius:   12,
                  background:     '#2F80ED',
                  color:          '#fff',
                  fontWeight:     700,
                  fontSize:       '0.9375rem',
                  textDecoration: 'none',
                  boxShadow:      '0 2px 16px rgba(47,128,237,0.4)',
                }}
              >
                Спросить AI
              </Link>
              <Link
                href="/catalog"
                style={{
                  padding:        '0.75rem 1.5rem',
                  borderRadius:   12,
                  border:         '1.5px solid rgba(255,255,255,0.2)',
                  color:          '#fff',
                  fontWeight:     600,
                  fontSize:       '0.9375rem',
                  textDecoration: 'none',
                  background:     'rgba(255,255,255,0.06)',
                }}
              >
                Смотреть каталог
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '2.5rem', marginTop: '2.5rem' }}>
              {[
                { num: '40+',  label: 'ЖК в базе' },
                { num: 'AI',   label: 'подборка' },
                { num: 'CPL',  label: 'монетизация' },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.5rem', color: '#fff', fontWeight: 700 }}>
                    {num}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — quick search card */}
          <div
            style={{
              background:   'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
              border:       '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20,
              padding:      '1.75rem',
            }}
          >
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '1.25rem' }}>
              Быстрый подбор
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {[
                { label: 'Район', id: 'district', options: ['Любой', 'Советский', 'Кировский', 'Октябрьский', 'Ленинский', 'Демский'] },
                { label: 'Комнаты', id: 'rooms',    options: ['Любые', 'Студия', '1', '2', '3+'] },
              ].map(({ label, id, options }) => (
                <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                    {label}
                  </label>
                  <select
                    style={{
                      background:  'rgba(255,255,255,0.1)',
                      border:      '1px solid rgba(255,255,255,0.15)',
                      color:       '#fff',
                      padding:     '0.6rem 0.875rem',
                      borderRadius: 8,
                      fontFamily:  'Manrope, sans-serif',
                      fontSize:    '0.875rem',
                      outline:     'none',
                      appearance:  'none',
                    }}
                  >
                    {options.map((o) => <option key={o} value={o} style={{ background: '#1a2a3a' }}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { label: 'Бюджет от, млн ₽', placeholder: '2' },
                { label: 'До, млн ₽',         placeholder: '10' },
              ].map(({ label, placeholder }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{label}</label>
                  <input
                    type="number"
                    placeholder={placeholder}
                    style={{
                      background:  'rgba(255,255,255,0.1)',
                      border:      '1px solid rgba(255,255,255,0.15)',
                      color:       '#fff',
                      padding:     '0.6rem 0.875rem',
                      borderRadius: 8,
                      fontFamily:  'Manrope, sans-serif',
                      fontSize:    '0.875rem',
                      outline:     'none',
                    }}
                  />
                </div>
              ))}
            </div>

            <Link
              href="/catalog"
              style={{
                display:        'block',
                textAlign:      'center',
                padding:        '0.75rem',
                borderRadius:   12,
                background:     '#2F80ED',
                color:          '#fff',
                fontWeight:     700,
                fontSize:       '0.9375rem',
                textDecoration: 'none',
                boxShadow:      '0 2px 12px rgba(47,128,237,0.35)',
              }}
            >
              Найти квартиру
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOT PROPERTIES ────────────────────────────────── */}
      {hotProperties.items.length > 0 && (
        <section style={{ maxWidth: 1400, margin: '0 auto', padding: '3rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.25rem', fontWeight: 700 }}>
              Горячие предложения
            </h2>
            <Link
              href="/catalog"
              style={{ color: '#2F80ED', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
            >
              Все ЖК →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {hotProperties.items.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── AI CTA ────────────────────────────────────────── */}
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        <div
          style={{
            background:   'linear-gradient(135deg, #0F1923, #1a2a3a)',
            borderRadius: 20,
            padding:      'clamp(2rem, 4vw, 3rem)',
            display:      'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap:          '2rem',
            alignItems:   'center',
          }}
        >
          <div>
            <div style={{ color: '#2F80ED', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              AI-консультант
            </div>
            <h3 style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff', fontSize: '1.375rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '1rem' }}>
              Расскажи о своих пожеланиях — AI подберёт лучшие варианты
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Укажи бюджет, район, количество комнат — получи персональную подборку за 30 секунд.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <Link
              href="/chat"
              style={{
                display:        'block',
                textAlign:      'center',
                padding:        '0.875rem',
                borderRadius:   12,
                background:     '#2F80ED',
                color:          '#fff',
                fontWeight:     700,
                textDecoration: 'none',
                boxShadow:      '0 2px 16px rgba(47,128,237,0.4)',
              }}
            >
              Начать подбор
            </Link>
            <RequestSelectionButton source="manual" />
          </div>
        </div>
      </section>
    </main>
  );
}
