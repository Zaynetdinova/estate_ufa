import { Metadata } from 'next';
import { CalculatorClient } from '@/components/calculator/CalculatorClient';

export const metadata: Metadata = { title: 'Калькулятор инвестиций | Новостройки Уфы' };

export default function CalculatorPage() {
  return (
    <main style={{ maxWidth: 836, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Hero banner */}
      <div
        style={{
          background:    'linear-gradient(135deg, #0F1923, #1a2f47)',
          borderRadius:  16,
          padding:       '2.25rem 2.5rem',
          color:         '#fff',
          marginBottom:  '1.5rem',
          position:      'relative',
          overflow:      'hidden',
        }}
      >
        <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', fontSize: '5rem', opacity: 0.15, pointerEvents: 'none' }}>
          📊
        </div>
        <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Инвестиционный калькулятор
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: 0 }}>
          Рассчитайте реальную доходность и срок окупаемости квартиры
        </p>
      </div>

      <CalculatorClient />
    </main>
  );
}
