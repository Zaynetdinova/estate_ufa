'use client';

import { useState, useEffect, useCallback } from 'react';

interface Lead {
  id:        number;
  source:    string;
  status:    string;
  score:     number;
  notes:     string | null;
  contactName:  string | null;
  contactPhone: string | null;
  message:      string | null;
  category:     string | null;
  urgency:      string | null;
  aiSummary:    string | null;
  classification: { name?: string | null; budget?: number | null; rooms?: number | null } | null;
  createdAt: string;
  snapshot:  Record<string, unknown> | null;
  sessionId:    string | null;
  managerNotes: string | null;
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
  manual:     '🏠 Страница ЖК',
  calculator: '🧮 Калькулятор',
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  buy:      { label: 'Покупка',      color: '#27AE60', bg: '#E8F8EE' },
  rent_out: { label: 'Сдать',        color: '#2F80ED', bg: '#EBF4FF' },
  consult:  { label: 'Консультация', color: '#9B59B6', bg: '#F5EEFB' },
  spam:     { label: 'Спам',         color: '#828282', bg: '#F2F2F2' },
};

const URGENCY_LABEL: Record<string, string> = {
  high:   '🔥 Срочно',
  medium: '⏳ Есть срок',
  low:    'Без спешки',
};

// То же правило, что isHotLead в API: высокий score или срочная заявка, но не спам
const isHot = (lead: Lead) =>
  lead.category !== 'spam' && (lead.score >= 10 || lead.urgency === 'high');

function CategoryBadge({ category }: { category: string | null }) {
  const cfg = category ? CATEGORY_CONFIG[category] : undefined;
  if (!cfg) return <span style={{ fontSize: '0.75rem', color: 'rgba(15,25,35,0.35)' }}>—</span>;
  return (
    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

interface ChatLine {
  id:        number;
  role:      'user' | 'assistant';
  content:   string;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

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
  const [hideSpam,      setHideSpam]      = useState(true);
  const [updating,      setUpdating]      = useState<number | null>(null);
  const [selected,      setSelected]      = useState<Lead | null>(null);
  const [denied,        setDenied]        = useState(false);
  const [actionError,   setActionError]   = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setDenied(true);
      setLoading(false);
      return;
    }
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        setDenied(true);
        return;
      }
      const data = await res.json();
      const list: Lead[] = Array.isArray(data) ? data : [];
      setLeads(list);
      // Ссылка из Telegram ведёт на /admin/leads?id=N — сразу открываем карточку лида
      const id = Number(new URLSearchParams(window.location.search).get('id'));
      if (id) setSelected(list.find((l) => l.id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const patchLead = (leadId: number, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, ...patch } : l));
    setSelected((s) => s?.id === leadId ? { ...s, ...patch } : s);
  };

  const updateStatus = async (leadId: number, status: string) => {
    setUpdating(leadId);
    setActionError(null);
    try {
      await apiRequest(`/leads/${leadId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      patchLead(leadId, { status });
    } catch {
      setActionError(`Не удалось изменить статус лида #${leadId}. Попробуйте ещё раз.`);
    } finally {
      setUpdating(null);
    }
  };

  const saveNotes = async (leadId: number, managerNotes: string) => {
    setActionError(null);
    try {
      const updated = await apiRequest<Lead>(`/leads/${leadId}/notes`, { method: 'PATCH', body: JSON.stringify({ managerNotes }) });
      patchLead(leadId, { managerNotes: updated.managerNotes });
      return true;
    } catch {
      setActionError(`Не удалось сохранить заметку к лиду #${leadId}. Попробуйте ещё раз.`);
      return false;
    }
  };

  const filtered = leads
    .filter((l) => filterStatus === 'all' || l.status === filterStatus)
    .filter((l) => !hideSpam || l.category !== 'spam');

  // Статистика
  const stats = {
    total:   leads.length,
    new:     leads.filter((l) => l.status === 'new').length,
    hot:     leads.filter(isHot).length,
    spam:    leads.filter((l) => l.category === 'spam').length,
    avgScore: leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0,
  };

  if (denied) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'rgba(15,25,35,0.6)' }}>
        Нет доступа. Панель лидов доступна только менеджерам.
      </div>
    );
  }

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
          { label: 'Горячих',        value: stats.hot,      color: '#EB5757' },
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
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontSize: '0.8125rem', color: 'rgba(15,25,35,0.65)', cursor: 'pointer' }}>
          <input type="checkbox" checked={hideSpam} onChange={(e) => setHideSpam(e.target.checked)} />
          Скрыть спам ({stats.spam})
        </label>
      </div>

      {actionError && (
        <div
          role="alert"
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 10, background: 'rgba(235,87,87,0.1)', color: '#EB5757', fontSize: '0.875rem' }}
        >
          <span style={{ flex: 1 }}>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: 'none', border: 'none', color: '#EB5757', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(15,25,35,0.4)' }}>Загрузка…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(15,25,35,0.4)' }}>Лидов нет</div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {/* Table */}
          <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 16, border: '1px solid rgba(15,25,35,0.08)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(15,25,35,0.08)' }}>
                  {['#', 'Клиент', 'Заявка', 'Источник', 'Скор', 'Статус', 'Дата', 'Действие'].map((h) => (
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
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'rgba(15,25,35,0.45)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        #{lead.id}{isHot(lead) ? ' 🔥' : ''}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{lead.contactName ?? lead.user?.name ?? 'Аноним'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(15,25,35,0.45)', whiteSpace: 'nowrap' }}>{lead.contactPhone ?? lead.user?.email ?? '—'}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', maxWidth: 280 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                          <CategoryBadge category={lead.category} />
                          {lead.urgency && (
                            <span style={{ fontSize: '0.75rem', color: 'rgba(15,25,35,0.6)', whiteSpace: 'nowrap' }}>
                              {URGENCY_LABEL[lead.urgency] ?? lead.urgency}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(15,25,35,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lead.aiSummary ?? lead.message ?? ''}
                        </div>
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
                maxHeight:    'calc(100vh - 100px)',
                overflowY:    'auto',
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
                  { label: 'Имя',      value: selected.contactName ?? selected.user?.name ?? 'Аноним' },
                  { label: 'Email',    value: selected.user?.email ?? '—' },
                  { label: 'Телефон', value: selected.contactPhone ?? selected.user?.phone ?? '—' },
                  { label: 'Источник', value: SOURCE_LABEL[selected.source] ?? selected.source },
                  { label: 'Скор',    value: `${selected.score}/20` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: 'rgba(15,25,35,0.5)' }}>{label}</span>
                    <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
                  </div>
                ))}

                {selected.notes && (
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(15,25,35,0.6)' }}>📍 {selected.notes}</div>
                )}

                {selected.message && (
                  <>
                    <div style={{ height: 1, background: 'rgba(15,25,35,0.06)', margin: '0.25rem 0' }} />
                    <div style={{ fontSize: '0.75rem', color: 'rgba(15,25,35,0.45)' }}>Текст заявки</div>
                    <div style={{ background: '#F7F9FC', borderRadius: 8, padding: '0.625rem 0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {selected.message}
                    </div>
                  </>
                )}

                {selected.category && (
                  <>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(15,25,35,0.45)', marginTop: '0.25rem' }}>
                      AI-разбор — проверьте перед звонком
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <CategoryBadge category={selected.category} />
                      {selected.urgency && <span style={{ fontSize: '0.8125rem' }}>{URGENCY_LABEL[selected.urgency] ?? selected.urgency}</span>}
                    </div>
                    {selected.aiSummary && <div style={{ color: 'rgba(15,25,35,0.75)' }}>{selected.aiSummary}</div>}
                    {selected.classification?.budget != null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(15,25,35,0.5)' }}>Бюджет из текста</span>
                        <span style={{ fontWeight: 600 }}>{(selected.classification.budget / 1_000_000).toFixed(1)} млн ₽</span>
                      </div>
                    )}
                    {selected.classification?.rooms != null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(15,25,35,0.5)' }}>Комнат</span>
                        <span style={{ fontWeight: 600 }}>{selected.classification.rooms === 0 ? 'студия' : selected.classification.rooms}</span>
                      </div>
                    )}
                  </>
                )}

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

              <ManagerNotes key={`notes-${selected.id}`} lead={selected} onSave={saveNotes} />
              <ChatTranscript key={`chat-${selected.id}`} lead={selected} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: '0.75rem', color: 'rgba(15,25,35,0.45)', marginBottom: 6 };

function ManagerNotes({ lead, onSave }: { lead: Lead; onSave: (leadId: number, notes: string) => Promise<boolean> }) {
  const [value,  setValue]  = useState(lead.managerNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const dirty = value !== (lead.managerNotes ?? '');

  const save = async () => {
    setSaving(true);
    setSaved(await onSave(lead.id, value));
    setSaving(false);
  };

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <div style={sectionTitle}>Заметки менеджера</div>
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false); }}
        placeholder="Итог звонка, договорённости, следующий шаг"
        maxLength={5000}
        rows={4}
        style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.625rem', borderRadius: 8, border: '1.5px solid rgba(15,25,35,0.12)', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', resize: 'vertical' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <button
          onClick={save}
          disabled={!dirty || saving}
          style={{ padding: '0.4rem 0.875rem', borderRadius: 8, border: 'none', background: dirty ? '#2F80ED' : '#E2E8F0', color: dirty ? '#fff' : 'rgba(15,25,35,0.4)', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '0.78rem', cursor: dirty && !saving ? 'pointer' : 'default' }}
        >
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
        {saved && !dirty && <span style={{ fontSize: '0.75rem', color: '#27AE60' }}>Сохранено</span>}
      </div>
    </div>
  );
}

function ChatTranscript({ lead }: { lead: Lead }) {
  const [lines,   setLines]   = useState<ChatLine[] | null>(null);
  const [failed,  setFailed]  = useState(false);

  useEffect(() => {
    if (!lead.sessionId) return;
    apiRequest<ChatLine[]>(`/leads/${lead.id}/chat`)
      .then(setLines)
      .catch(() => setFailed(true));
  }, [lead.id, lead.sessionId]);

  const muted: React.CSSProperties = { fontSize: '0.8125rem', color: 'rgba(15,25,35,0.45)' };

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <div style={sectionTitle}>Переписка с AI-консультантом</div>
      {!lead.sessionId ? (
        <div style={muted}>Заявка оставлена без привязки к чату</div>
      ) : failed ? (
        <div style={{ ...muted, color: '#EB5757' }}>Не удалось загрузить переписку</div>
      ) : lines === null ? (
        <div style={muted}>Загрузка…</div>
      ) : lines.length === 0 ? (
        <div style={muted}>Клиент не писал в чат</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto', padding: 2 }}>
          {lines.map((line) => (
            <div
              key={line.id}
              style={{
                alignSelf:    line.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth:     '90%',
                padding:      '0.4rem 0.625rem',
                borderRadius: 10,
                background:   line.role === 'user' ? '#EBF4FF' : '#F7F9FC',
                fontSize:     '0.78rem',
                lineHeight:   1.45,
                whiteSpace:   'pre-wrap',
                wordBreak:    'break-word',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: 'rgba(15,25,35,0.4)', marginBottom: 2 }}>
                {line.role === 'user' ? 'Клиент' : 'AI'} · {new Date(line.createdAt).toLocaleString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
              {line.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
