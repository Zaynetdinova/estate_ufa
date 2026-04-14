import Link from 'next/link';

export default function NotFound() {
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
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏚</div>
      <h1
        style={{
          fontFamily:   'Unbounded, sans-serif',
          fontSize:     '1.5rem',
          fontWeight:   700,
          marginBottom: '0.75rem',
        }}
      >
        Страница не найдена
      </h1>
      <p style={{ color: 'rgba(15,25,35,0.55)', marginBottom: '2rem', maxWidth: 400, lineHeight: 1.6 }}>
        Возможно, ЖК был удалён или вы перешли по устаревшей ссылке.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/catalog"
          style={{
            padding:        '0.75rem 1.5rem',
            borderRadius:   12,
            background:     '#2F80ED',
            color:          '#fff',
            fontWeight:     700,
            textDecoration: 'none',
            fontSize:       '0.9375rem',
          }}
        >
          Смотреть каталог
        </Link>
        <Link
          href="/"
          style={{
            padding:        '0.75rem 1.5rem',
            borderRadius:   12,
            border:         '1.5px solid rgba(15,25,35,0.15)',
            color:          '#0F1923',
            fontWeight:     600,
            textDecoration: 'none',
            fontSize:       '0.9375rem',
          }}
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
