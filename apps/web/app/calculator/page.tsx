import { Metadata } from 'next';
import { CalculatorClient } from '@/components/calculator/CalculatorClient';

export const metadata: Metadata = { title: 'Калькулятор инвестиций | Новостройки Уфы' };

export default function CalculatorPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Калькулятор инвестиций
      </h1>
      <p style={{ color: 'rgba(15,25,35,0.55)', marginBottom: '2rem', fontSize: '0.9375rem' }}>
        Рассчитайте доходность и срок окупаемости квартиры в новостройке
      </p>
      <CalculatorClient />
    </main>
  );
}
