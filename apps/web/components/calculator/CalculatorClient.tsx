'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { leadsApi } from '@/lib/api';
import { useTrackEvent } from '@/lib/hooks/useTrackEvent';

interface CalcParams {
  price:          number;
  repair:         number;
  monthlyRent:    number;
  monthlyExpenses: number;
  taxMode:        'ndfl' | 'patent';
}

interface CalcResult {
  yieldPct:     number;
  paybackYears: number;
  netIncome:    number;
  verdict:      'high' | 'mid' | 'low' | 'bad';
}

function calcInvestment(p: CalcParams): CalcResult {
  const totalCost  = p.price + p.repair;
  const grossRent  = p.monthlyRent * 11;
  const taxRate    = p.taxMode === 'ndfl' ? 0.13 : 0.04;
  const tax        = grossRent * taxRate;
  const expenses   = p.monthlyExpenses * 12;
  const netIncome  = grossRent - expenses - tax;
  const yieldPct   = (netIncome / totalCost) * 100;
  const paybackYears = netIncome > 0 ? totalCost / netIncome : Infinity;

  return {
    yieldPct:     +yieldPct.toFixed(2),
    paybackYears: +paybackYears.toFixed(1),
    netIncome,
    verdict:
      paybackYears < 15 ? 'high' :
      paybackYears < 20 ? 'mid'  :
      paybackYears < 25 ? 'low'  : 'bad',
  };
}

const VERDICT_CONFIG = {
  high: { label: 'Отличная инвестиция', color: '#27AE60', bg: '#E8F8EE' },
  mid:  { label: 'Хорошая инвестиция',  color: '#2F80ED', bg: '#EBF4FF' },
  low:  { label: 'Средняя доходность',  color: '#F2994A', bg: '#FFF4E8' },
  bad:  { label: 'Низкая доходность',   color: '#EB5757', bg: '#FEF0F0' },
};

type Field = keyof Omit<CalcParams, 'taxMode'>;

export function CalculatorClient() {
  const searchParams = useSearchParams();
  const track        = useTrackEvent();

  const [params, setParams] = useState<CalcParams>({
    price:           Number(searchParams.get('price') ?? 4_000_000),
    repair:          500_000,
    monthlyRent:     30_000,
    monthlyExpenses: 5_000,
    taxMode:         'patent',
  });
  const [result,      setResult]      = useState<CalcResult | null>(null);
  const [leadSent,    setLeadSent]    = useState(false);

  const handleCalc = useCallback(() => {
    const r = calcInvestment(params);
    setResult(r);

    // Трекаем CALCULATOR_USED (+2 к скору лида)
    track('CALCULATOR_USED', {
      price:          params.price,
      repair:         params.repair,
      monthlyRent:    params.monthlyRent,
      taxMode:        params.taxMode,
      yieldPct:       r.yieldPct,
      paybackYears:   r.paybackYears,
      propertyId:     searchParams.get('propertyId') ? Number(searchParams.get('propertyId')) : undefined,
    });
  }, [params, track, searchParams]);

  const handleGetLead = async () => {
    if (leadSent) return;
    track('REQUEST_SELECTION', { source: 'calculator' });
    await leadsApi.create({ source: 'calculator' }).catch(() => null);
    setLeadSent(true);
  };

  const set = (field: Field | 'taxMode') => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = field === 'taxMode' ? e.target.value : Number(e.target.value);
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  const FIELDS: { label: string; field: Field; step: number; suffix: string }[] = [
    { label: 'Стоимость квартиры, ₽',    field: 'price',           step: 100_000, suffix: '₽' },
    { label: 'Ремонт и обустройство, ₽', field: 'repair',          step: 50_000,  suffix: '₽' },
    { label: 'Аренда в месяц, ₽',        field: 'monthlyRent',     step: 1_000,   suffix: '₽' },
    { label: 'Расходы в месяц, ₽',       field: 'monthlyExpenses', step: 500,     suffix: '₽' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>

      {/* Form */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '1.75rem', border: '1px solid rgba(15,25,35,0.08)' }}>
        <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          Параметры
        </h2>

        {FIELDS.map(({ label, field, step }) => (
          <div key={field} style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(15,25,35,0.65)' }}>{label}</label>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F1923' }}>
                {params[field].toLocaleString('ru')} ₽
              </span>
            </div>
            <input
              type="range"
              min={step}
              max={field === 'price' ? 30_000_000 : field === 'repair' ? 3_000_000 : field === 'monthlyRent' ? 100_000 : 30_000}
              step={step}
              value={params[field]}
              onChange={set(field)}
              style={{ width: '100%', accentColor: '#2F80ED', cursor: 'pointer' }}
            />
          </div>
        ))}

        {/* Tax mode */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(15,25,35,0.65)', display: 'block', marginBottom: 8 }}>
            Налогообложение
          </label>
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            {([['patent', 'Самозанятый (4%)'], ['ndfl', 'НДФЛ (13%)']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setParams((p) => ({ ...p, taxMode: value }))}
                style={{
                  flex:         1,
                  padding:      '0.6rem',
                  borderRadius: 10,
                  border:       `1.5px solid ${params.taxMode === value ? '#2F80ED' : 'rgba(15,25,35,0.12)'}`,
                  background:   params.taxMode === value ? '#EBF4FF' : '#fff',
                  color:        params.taxMode === value ? '#2F80ED' : 'rgba(15,25,35,0.6)',
                  fontFamily:   'Manrope, sans-serif',
                  fontWeight:   600,
                  fontSize:     '0.8125rem',
                  cursor:       'pointer',
                  transition:   'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCalc}
          style={{
            width:        '100%',
            padding:      '0.875rem',
            borderRadius: 12,
            border:       'none',
            background:   '#2F80ED',
            color:        '#fff',
            fontFamily:   'Manrope, sans-serif',
            fontWeight:   700,
            fontSize:     '1rem',
            cursor:       'pointer',
            boxShadow:    '0 2px 12px rgba(47,128,237,0.35)',
            transition:   'transform 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Рассчитать
        </button>
      </div>

      {/* Result */}
      <div>
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Verdict */}
            <div
              style={{
                background:   VERDICT_CONFIG[result.verdict].bg,
                border:       `1.5px solid ${VERDICT_CONFIG[result.verdict].color}30`,
                borderRadius: 20,
                padding:      '1.5rem',
                textAlign:    'center',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                {result.verdict === 'high' ? '🚀' : result.verdict === 'mid' ? '👍' : result.verdict === 'low' ? '🤔' : '⚠️'}
              </div>
              <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: VERDICT_CONFIG[result.verdict].color, marginBottom: 4 }}>
                {VERDICT_CONFIG[result.verdict].label}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(15,25,35,0.55)' }}>
                Окупаемость {result.paybackYears} {result.paybackYears === Infinity ? '∞' : 'лет'}
              </div>
            </div>

            {/* Metrics */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '1.5rem', border: '1px solid rgba(15,25,35,0.08)' }}>
              <h3 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                Результаты расчёта
              </h3>
              {[
                { label: 'Доходность в год',  value: `${result.yieldPct}%`,                              color: result.yieldPct >= 7 ? '#27AE60' : result.yieldPct >= 5 ? '#2F80ED' : '#EB5757' },
                { label: 'Чистый доход/год',  value: `${result.netIncome.toLocaleString('ru')} ₽`,       color: result.netIncome > 0 ? '#27AE60' : '#EB5757' },
                { label: 'Срок окупаемости',  value: result.paybackYears === Infinity ? '∞' : `${result.paybackYears} лет`, color: '#0F1923' },
                { label: 'Вложений итого',    value: `${(params.price + params.repair).toLocaleString('ru')} ₽`,            color: '#0F1923' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid rgba(15,25,35,0.06)' }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'rgba(15,25,35,0.6)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color, fontSize: '0.9375rem' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleGetLead}
              disabled={leadSent}
              style={{
                padding:      '0.875rem',
                borderRadius: 12,
                border:       'none',
                background:   leadSent ? '#27AE60' : '#27AE60',
                color:        '#fff',
                fontFamily:   'Manrope, sans-serif',
                fontWeight:   700,
                fontSize:     '0.9375rem',
                cursor:       leadSent ? 'default' : 'pointer',
                boxShadow:    '0 2px 12px rgba(39,174,96,0.35)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                gap:          8,
              }}
            >
              {leadSent ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Заявка принята! Специалист свяжется с вами
                </>
              ) : (
                'Получить подборку по этим параметрам'
              )}
            </button>
          </div>
        ) : (
          <div
            style={{
              background:     '#fff',
              borderRadius:   20,
              padding:        '3rem 2rem',
              border:         '1px solid rgba(15,25,35,0.08)',
              textAlign:      'center',
              color:          'rgba(15,25,35,0.35)',
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            '0.75rem',
            }}
          >
            <span style={{ fontSize: '2.5rem' }}>🧮</span>
            <div style={{ fontWeight: 600 }}>Заполните параметры и нажмите «Рассчитать»</div>
            <div style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
              Узнайте доходность инвестиций в новостройку
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
