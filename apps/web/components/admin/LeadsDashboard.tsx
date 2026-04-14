'use client';

import { useState, useEffect, useCallback } from 'react';

interface Lead {
  id:        number;
  source:    string;
  status:    string;
  score:     number;
  notes:     string | null;
  createdAt: string;
  snapshot:  Record<string, unknown> | null;
  user: {
    id:    number;
    email: string;
    name:  string | null;
    phone: string | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:         { label: 'Новый',       color: '#2F80ED', bg: '#EBF4FF' },
  contacted:   { label: 'Контакт',     color: '#F2994A', bg: '#FFF4E8' },
  qualified:   { label: 'Квалиф.',     color: '#9B59B6', bg: '#F5EEFB' },
  closed_won:  { label: 'Закрыт ✓',   color: '#27AE60', bg: '#E8F8EE' },
  closed_lost: { label: 'Закрыт ✗',   color: '#EB5757', bg: '#FEF0F0' },
};

const SOURCE_LABEL: Record<string, string> = {
  chat:       '💬 Чат',
  manual:     '👆 Кнопка',
  calculator: '🧮 Калькулятор',
};

function ScoreBar({ score }: { score: number }) {
  const max   = 20;
  const pct   = Math.min((score / max) * 100, 100);
  const color = pct >= 75 ? '#27AE60' : pct >= 40 ? '#F2994A' : '#2F80ED';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.8125rem', color, minWidth: 28 }}>{score}</span>
    </div>
  );
}

export function LeadsDashboard() {
  const [leads,         setLeads]         = useState<Lead[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState<string>('all');
  const [updating,      setUpdating]      = useState<number | null>(null);
  const [selected,      setSelected]      = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStatus = async (leadId: number, status: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setUpdating(leadId);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/status`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status } : l));
      if (selected?.id === leadId) setSelected((s) => s ? { ...s, status } : s);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filterStatus === 'all'
    ? leads
    : leads.filter((l) => l.status === filterStatus);

  // Статистика
  const stats = {
    total:   leads.length,
    new:     leads.filter((l) => l.status === 'new').length,
    hot:     leads.filter((l) => l.score >= 10).length,
    avgScore: leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0,
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Лиды
      </h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Всего лидов',    value: stats.total,    color: '#2F80ED' },
          { label: 'Новых',          value: stats.new,      color: '#F2994A' },
          { label: 'Горячих (≥10)',  value: stats.hot,      color: '#EB5757' },
          { label: 'Средний скор',   value: stats.avgScore, color: '#27AE60' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{ background: '#fff', borderRadius: 16, padding: '1.25rem', border: '1px solid rgba(15,25,35,0.08)' }}
          >
            <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.5)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.75rem', fontWeight: 700, color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['all', ...Object.keys(STATUS_CONFIG)].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding:      '0.4rem 0.875rem',
              borderRadius: 8,
              border:       '1.5px solid',
              borderColor:  filterStatus === s ? '#2F80ED' : 'rgba(15,25,35,0.12)',
              background:   filterStatus === s ? '#EBF4FF' : '#fff',
              color:        filterStatus === s ? '#2F80ED' : 'rgba(15,25,35,0.65)',
              fontFamily:   'Manrope, sans-serif',
              fontWeight:   filterStatus === s ? 700 : 400,
              fontSize:     '0.8125rem',
              cursor:       'pointer',
            }}
          >
            {s === 'all' ? `Все (${leads.length})` : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(15,25,35,0.4)' }}>Загрузка…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(15,25,35,0.4)' }}>Лидов нет</div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {/* Table */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 16, border: '1px solid rgba(15,25,35,0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(15,25,35,0.08)' }}>
                  {['#', 'Пользователь', 'Источник', 'Скор', 'Статус', 'Дата', 'Действие'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding:   '0.875rem 1rem',
                        textAlign: 'left',
                        fontSize:  '0.75rem',
                        fontWeight: 600,
                        color:     'rgba(15,25,35,0.45)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const sc = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelected(lead)}
                      style={{
                        borderBottom: '1px solid rgba(15,25,35,0.05)',
                        cursor:       'pointer',
                        background:   selected?.id === lead.id ? '#F7F9FC' : 'transparent',
                        transition:   'background 0.15s',
                      }}
                      onMouseEnter={(e) => { if (selected?.id !== lead.id) (e.currentTarget as HTMLElement).style.background = '#FAFBFC'; }}
                      onMouseLeave={(e) => { if (selected?.id !== lead.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'rgba(15,25,35,0.45)', fontWeight: 600 }}>
                        #{lead.id}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{lead.user?.name ?? 'Аноним'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(15,25,35,0.45)' }}>{lead.user?.email ?? '—'}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'rgba(15,25,35,0.65)' }}>
                        {SOURCE_LABEL[lead.source] ?? lead.source}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', minWidth: 100 }}>
                        <ScoreBar score={lead.score} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{
                          padding:      '3px 8px',
                          borderRadius: 6,
                          fontSize:     '0.75rem',
                          fontWeight:   700,
                          color:        sc.color,
                          background:   sc.bg,
                        }}>
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', color: 'rgba(15,25,35,0.45)', whiteSpace: 'nowrap' }}>
                        {new Date(lead.createdAt).toLocaleDateString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <select
                          value={lead.status}
                          onChange={(e) => { e.stopPropagation(); updateStatus(lead.id, e.target.value); }}
                          disabled={updating === lead.id}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding:     '0.35rem 0.5rem',
                            borderRadius: 6,
                            border:       '1.5px solid rgba(15,25,35,0.12)',
                            fontFamily:   'Manrope, sans-serif',
                            fontSize:     '0.78rem',
                            cursor:       'pointer',
                            background:   '#fff',
                          }}
                        >
                          {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          {selected && (
            <div
              style={{
                width:        320,
                flexShrink:   0,
                background:   '#fff',
                borderRadius: 16,
                border:       '1px solid rgba(15,25,35,0.08)',
                padding:      '1.25rem',
                position:     'sticky',
                top:          80,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Лид #{selected.id}</div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,25,35,0.4)', fontSize: '1.25rem', lineHeight: 1 }}
                >×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
                {[
                  { label: 'Имя',      value: selected.user?.name ?? 'Аноним' },
                  { label: 'Email',    value: selected.user?.email ?? '—' },
                  { label: 'Телефон', value: selected.user?.phone ?? '—' },
                  { label: 'Источник', value: SOURCE_LABEL[selected.source] ?? selected.source },
                  { label: 'Скор',    value: `${selected.score}/20` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: 'rgba(15,25,35,0.5)' }}>{label}</span>
                    <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
                  </div>
                ))}

                {selected.snapshot && (
                  <>
                    <div style={{ height: 1, background: 'rgba(15,25,35,0.06)', margin: '0.25rem 0' }} />
                    {selected.snapshot.budgetMin && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(15,25,35,0.5)' }}>Бюджет</span>
                        <span style={{ fontWeight: 600 }}>
                          {((selected.snapshot.budgetMin as number) / 1_000_000).toFixed(1)}
                          {selected.snapshot.budgetMax ? ` — ${((selected.snapshot.budgetMax as number) / 1_000_000).toFixed(1)}` : '+'}
                          {' млн ₽'}
                        </span>
                      </div>
                    )}
                    {selected.snapshot.viewedPropertiesCount !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(15,25,35,0.5)' }}>Просмотрел ЖК</span>
                        <span style={{ fontWeight: 600 }}>{String(selected.snapshot.viewedPropertiesCount)}</span>
                      </div>
                    )}
                    {selected.snapshot.intent && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(15,25,35,0.5)' }}>Intent</span>
                        <span style={{
                          fontWeight: 700,
                          color: selected.snapshot.intent === 'high' ? '#EB5757' : selected.snapshot.intent === 'medium' ? '#F2994A' : '#2F80ED',
                        }}>
                          {selected.snapshot.intent === 'high' ? '🔥 Горячий' : selected.snapshot.intent === 'medium' ? '🌡 Тёплый' : '❄️ Холодный'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(15,25,35,0.45)', marginBottom: 6 }}>Изменить статус</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {Object.entries(STATUS_CONFIG).map(([val, { label, color, bg }]) => (
                    <button
                      key={val}
                      onClick={() => updateStatus(selected.id, val)}
                      disabled={selected.status === val || updating === selected.id}
                      style={{
                        padding:     '0.5rem',
                        borderRadius: 8,
                        border:       `1.5px solid ${selected.status === val ? color : 'rgba(15,25,35,0.1)'}`,
                        background:   selected.status === val ? bg : '#fff',
                        color:        selected.status === val ? color : 'rgba(15,25,35,0.6)',
                        fontFamily:   'Manrope, sans-serif',
                        fontWeight:   selected.status === val ? 700 : 400,
                        fontSize:     '0.75rem',
                        cursor:       selected.status === val ? 'default' : 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
