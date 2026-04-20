'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTrackEvent } from '@/lib/hooks/useTrackEvent';

interface CalcParams {
  price:           number;
  area:            number;
  repair:          number;
  monthlyRent:     number;
  monthlyExpenses: number;
  taxMode:         'ndfl' | 'self';
}

interface CalcResult {
  yieldPct:     number;
  paybackYears: number;
  netIncome:    number;
  verdict:      'high' | 'mid' | 'low' | 'bad';
}

function calcInvestment(p: CalcParams): CalcResult {
  const totalCost    = p.price + p.repair;
  const grossRent    = p.monthlyRent * 11;
  const taxRate      = p.taxMode === 'ndfl' ? 0.13 : 0.04;
  const tax          = grossRent * taxRate;
  const expenses     = p.monthlyExpenses * 12;
  const netIncome    = grossRent - expenses - tax;
  const yieldPct     = (netIncome / totalCost) * 100;
  const paybackYears = netIncome > 0 ? totalCost / netIncome : Infinity;
  return {
    yieldPct:     +yieldPct.toFixed(1),
    paybackYears: +paybackYears.toFixed(1),
    netIncome,
    verdict:
      paybackYears < 15 ? 'high' :
      paybackYears < 20 ? 'mid'  :
      paybackYears < 25 ? 'low'  : 'bad',
  };
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem',
  border: '1.5px solid rgba(15,25,35,0.1)', borderRadius: 10,
  fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
  color: '#0F1923', outline: 'none', background: '#fff',
  boxSizing: 'border-box',
};

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.9rem', fontWeight: 700,
  color: '#0F1923', marginBottom: '0.5rem',
};

const field: React.CSSProperties = { marginBottom: '1.25rem' };

function radioBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1, border: `1.5px solid ${active ? '#2F80ED' : 'rgba(15,25,35,0.1)'}`,
    borderRadius: 8, padding: '0.6rem 0.75rem', textAlign: 'center',
    fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
    color: active ? '#2F80ED' : 'rgba(15,25,35,0.5)',
    background: active ? '#EBF4FF' : '#fff',
    fontFamily: 'Manrope, sans-serif', transition: 'all 0.15s',
  };
}

export function CalculatorClient() {
  const searchParams = useSearchParams();
  const track        = useTrackEvent();

  const [params, setParams] = useState<CalcParams>({
    price:           Number(searchParams.get('price') ?? 5_000_000),
    area:            45,
    repair:          600_000,
    monthlyRent:     30_000,
    monthlyExpenses: 5_000,
    taxMode:         'ndfl',
  });

  const result = useMemo(() => calcInvestment(params), [params]);

  const set = (field: keyof CalcParams) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams((prev) => ({ ...prev, [field]: Number(e.target.value) }));
  };

  const verdictConfig = {
    high: { label: 'Отличная инвестиция',   icon: '🚀', color: '#27AE60', bg: '#E8F8EE', border: 'rgba(39,174,96,0.2)' },
    mid:  { label: 'Хорошая инвестиция',    icon: '👍', color: '#F2994A', bg: '#FFF8EC', border: 'rgba(242,153,74,0.2)' },
    low:  { label: 'Низкая привлекательность', icon: '⚠️', color: '#EB5757', bg: '#FFF3F3', border: 'rgba(235,87,87,0.2)' },
    bad:  { label: 'Низкая привлекательность', icon: '⚠️', color: '#EB5757', bg: '#FFF3F3', border: 'rgba(235,87,87,0.2)' },
  };

  const netK = Math.round(result.netIncome / 1000);

  return (
    <>
      {/* ── Два блока рядом ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Квартира */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(15,25,35,0.08)', padding: '2rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(15,25,35,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.75rem' }}>
            🏠 Квартира
          </div>

          <div style={field}>
            <label style={lbl}>Стоимость квартиры (₽)</label>
            <input type="number" value={params.price} onChange={set('price')} style={inp} />
          </div>

          <div style={field}>
            <label style={lbl}>Площадь (м²)</label>
            <input type="number" value={params.area} onChange={set('area')} style={inp} />
          </div>

          <div style={field}>
            <label style={lbl}>Ремонт и мебель (₽)</label>
            <input type="number" value={params.repair} onChange={set('repair')} style={inp} />
            <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.35)', marginTop: '0.35rem' }}>
              Учитывается в общей стоимости
            </div>
          </div>
        </div>

        {/* Аренда */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(15,25,35,0.08)', padding: '2rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(15,25,35,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.75rem' }}>
            💰 Аренда и расходы
          </div>

          <div style={field}>
            <label style={lbl}>Аренда в месяц (₽)</label>
            <input type="number" value={params.monthlyRent} onChange={set('monthlyRent')} style={inp} />
          </div>

          <div style={field}>
            <label style={lbl}>Коммуналка / расходы в месяц (₽)</label>
            <input type="number" value={params.monthlyExpenses} onChange={set('monthlyExpenses')} style={inp} />
          </div>

          <div>
            <label style={lbl}>Налоговый режим</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={radioBtn(params.taxMode === 'ndfl')} onClick={() => setParams((p) => ({ ...p, taxMode: 'ndfl' }))}>
                13% НДФЛ
              </button>
              <button style={radioBtn(params.taxMode === 'self')} onClick={() => setParams((p) => ({ ...p, taxMode: 'self' }))}>
                4% самозанятый
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Результаты ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(15,25,35,0.08)', padding: '2rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📊 Результаты расчёта
        </div>

        {/* 3 метрики */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            {
              num:   `${result.yieldPct}%`,
              label: 'Чистая годовая\nдоходность',
              color: result.yieldPct >= 8 ? '#27AE60' : result.yieldPct >= 5 ? '#F2994A' : '#EB5757',
            },
            {
              num:   result.paybackYears === Infinity ? '∞' : `${result.paybackYears} лет`,
              label: 'Срок\nокупаемости',
              color: result.paybackYears < 15 ? '#27AE60' : result.paybackYears < 20 ? '#F2994A' : '#EB5757',
            },
            {
              num:   `${netK > 0 ? netK : 0} тыс`,
              label: 'Чистый доход\nв год, ₽',
              color: result.netIncome > 0 ? '#2F80ED' : '#EB5757',
            },
          ].map(({ num, label, color }) => (
            <div key={label} style={{ background: '#F7F9FC', borderRadius: 12, padding: '1.25rem 1rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.6rem', fontWeight: 700, color, marginBottom: '0.4rem' }}>
                {num}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(15,25,35,0.55)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Разбивка */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {[
            `🏠 Аренда ${params.monthlyRent.toLocaleString('ru')} р/мес × 11 мес = ${(params.monthlyRent * 11).toLocaleString('ru')} р`,
            `📊 Налог ${params.taxMode === 'ndfl' ? '13% (НДФЛ)' : '4% (самозанятый)'} = ${Math.round(params.monthlyRent * 11 * (params.taxMode === 'ndfl' ? 0.13 : 0.04)).toLocaleString('ru')} р`,
            `🏡 Расходы = ${(params.monthlyExpenses * 12).toLocaleString('ru')} р`,
            `💰 Полная стоимость с ремонтом = ${(params.price + params.repair).toLocaleString('ru')} р`,
          ].map((line) => (
            <div key={line} style={{ fontSize: '0.82rem', color: 'rgba(15,25,35,0.55)' }}>{line}</div>
          ))}
        </div>

        {/* Вердикт */}
        <div style={{ borderRadius: 12, padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', background: verdictConfig[result.verdict].bg, border: `1px solid ${verdictConfig[result.verdict].border}` }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{verdictConfig[result.verdict].icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: verdictConfig[result.verdict].color }}>
              {verdictConfig[result.verdict].label}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(15,25,35,0.55)', marginTop: '0.15rem' }}>
              {result.paybackYears === Infinity || result.paybackYears >= 25
                ? 'Длинный срок окупаемости. Есть более выгодные варианты.'
                : `Окупаемость ${result.paybackYears} лет · вложения ${(params.price + params.repair).toLocaleString('ru')} ₽`}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
