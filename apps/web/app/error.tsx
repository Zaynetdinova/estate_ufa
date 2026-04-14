'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div
      style={{
        minHeight:      'calc(100vh - 64px)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        textAlign:      'center',
        padding:        '2rem',
      }}
    >
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        Что-то пошло не так
      </h2>
      <p style={{ color: 'rgba(15,25,35,0.55)', marginBottom: '0.5rem', maxWidth: 400, lineHeight: 1.6 }}>
        {error.message || 'Произошла непредвиденная ошибка.'}
      </p>
      <p style={{ color: 'rgba(15,25,35,0.35)', fontSize: '0.8rem', marginBottom: '2rem' }}>
        Мы уже знаем об этом и работаем над исправлением.
      </p>
      <button
        onClick={reset}
        style={{
          padding:      '0.75rem 1.5rem',
          borderRadius: 12,
          border:       'none',
          background:   '#2F80ED',
          color:        '#fff',
          fontWeight:   700,
          fontSize:     '0.9375rem',
          cursor:       'pointer',
          fontFamily:   'Manrope, sans-serif',
        }}
      >
        Попробовать снова
      </button>
    </div>
  );
}
