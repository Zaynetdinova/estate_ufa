export default function Loading() {
  return (
    <div
      style={{
        maxWidth: 1400,
        margin:   '0 auto',
        padding:  '2rem 1rem',
      }}
    >
      {/* Header skeleton */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={skeleton(200, 32)} />
        <div style={{ marginLeft: 'auto', ...skeleton(160, 40) }} />
      </div>

      {/* Cards grid skeleton */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap:                 '1.25rem',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(15,25,35,0.06)' }}>
            <div style={shimmer(undefined, 200)} />
            <div style={{ padding: '1rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={shimmer(100, 12)} />
              <div style={shimmer('80%', 20)} />
              <div style={shimmer(120, 18)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <div style={shimmer(80, 12)} />
                <div style={shimmer(80, 12)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
    </div>
  );
}

function skeleton(w: number | string, h: number): React.CSSProperties {
  return {
    width:        typeof w === 'number' ? w : w,
    height:       h,
    borderRadius: 8,
    background:   '#E2E8F0',
  };
}

function shimmer(w: number | string = '100%', h: number): React.CSSProperties {
  return {
    width:              typeof w === 'number' ? w : w,
    height:             h,
    borderRadius:       6,
    background:         'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
    backgroundSize:     '400% 100%',
    animation:          'shimmer 1.5s infinite',
    flexShrink:         0,
  };
}
