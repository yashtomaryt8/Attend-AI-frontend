import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardHeader, CardTitle, CardBody, Stat, Badge, Spinner, Empty, Toggle } from './ui';
import { api } from '../utils/api';

function Bar({ data, maxH = 56, colorFn }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: maxH + 20 }}>
      {data.map((d, i) => {
        const h = Math.max(Math.round((d.count / max) * maxH), d.count > 0 ? 3 : 0);
        const color = colorFn ? colorFn(d, i, data) : 'bg-gray-200';
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            {d.count > 0 && <span className="text-[9px] text-gray-400 font-mono leading-none">{d.count}</span>}
            <div className={`w-full rounded-sm ${color}`} style={{ height: h || 2 }} title={`${d.label ?? d.date}: ${d.count}`} />
            <span className="text-[9px] text-gray-400 leading-none">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [data,      setData]      = useState(null);
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState('');
  const [aiMode,    setAiMode]    = useState('groq');
  const [aiPrompt,  setAiPrompt]  = useState('');
  const [insight,   setInsight]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr,     setAiErr]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [a, s] = await Promise.all([api.analytics(), api.sessions({ date: today, limit: 30 })]);
      setData(a); setSessions(s); setErr('');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fetchInsight = async () => {
    setAiLoading(true); setInsight(''); setAiErr('');
    try {
      const r = await api.aiInsight(aiMode, aiPrompt);
      if (r.insight?.startsWith('Error:')) {
        setAiErr(r.insight);
      } else {
        setInsight(r.insight);
      }
    } catch (e) { setAiErr(e.message); }
    finally { setAiLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Spinner size={24} /></div>;

  const {
    total_users = 0, present_today = 0, attendance_rate = 0,
    week_data = [], hourly_data = [], top_attendees = [],
    week_avg = 0, late_today = 0, peak_hour = '—',
    week_total = 0, avg_duration_min = null,
  } = data || {};

  const maxH = Math.max(...hourly_data.map(d => d.count), 1);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Attendance patterns &amp; insights</p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>↺</Button>
      </div>

      {err && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-600">{err}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Rate Today"  value={`${attendance_rate}%`}
          sub={`${present_today} of ${total_users}`}
          valueClass={attendance_rate >= 75 ? 'text-green-600' : attendance_rate >= 50 ? 'text-amber-600' : 'text-red-600'} />
        <Stat label="Week Total"  value={week_total} sub={`avg ${week_avg}/day`} />
        <Stat label="Late Today"  value={late_today} sub="after 9:00 AM" valueClass="text-amber-600" />
        <Stat label="Avg Session" value={avg_duration_min ? `${avg_duration_min}m` : '—'} sub="duration today" />
      </div>

      {/* 7-day chart */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">7-Day Attendance</p>
            <span className="text-[11px] text-gray-400 font-mono">avg {week_avg}/day</span>
          </div>
          <Bar
            data={week_data}
            maxH={64}
            colorFn={(d, i, arr) => i === arr.length - 1 ? 'bg-gray-900' : 'bg-gray-200'}
          />
        </CardBody>
      </Card>

      {/* Hourly heatmap */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hourly Today</p>
            <span className="text-[11px] text-gray-400">Peak {peak_hour}</span>
          </div>
          <Bar
            data={hourly_data.map(d => ({ ...d, label: `${d.hour}` }))}
            maxH={40}
            colorFn={(d) => {
              if (d.count === 0) return 'bg-gray-100';
              if (d.count >= maxH * 0.7) return 'bg-gray-900';
              return 'bg-gray-400';
            }}
          />
          <p className="text-[10px] text-gray-400 mt-1">Dark = peak hour</p>
        </CardBody>
      </Card>

      {/* Top attendees */}
      {top_attendees.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top Attendees — All Time</CardTitle></CardHeader>
          <div className="divide-y divide-gray-50">
            {top_attendees.map((t, i) => {
              const pct = Math.round((t.total / (top_attendees[0]?.total || 1)) * 100);
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs w-5 text-center text-gray-400">{i === 0 ? '🥇' : `#${i + 1}`}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.user__name}</p>
                      {t.user__student_id && <p className="text-[11px] text-gray-400">{t.user__student_id}</p>}
                    </div>
                    <span className="text-xs font-bold text-gray-900 font-mono shrink-0">{t.total}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-8">
                    <div className="h-full bg-gray-900 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Sessions today */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Sessions Today</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[320px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Entry', 'Exit', 'Duration'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-semibold text-gray-900">{s.user_name}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono">
                      {new Date(s.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-2 text-gray-500 font-mono">
                      {s.exit_time
                        ? new Date(s.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : <Badge variant="green">Active</Badge>}
                    </td>
                    <td className="px-3 py-2 text-gray-500 font-mono">
                      {s.duration_minutes ? `${s.duration_minutes}m` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <CardHeader><CardTitle>AI Insights</CardTitle></CardHeader>
        <CardBody className="flex flex-col gap-3">
          {/* Mode */}
          <Toggle
            value={aiMode}
            onChange={setAiMode}
            options={[
              { value: 'groq',   label: '☁ Groq (free online)' },
              { value: 'ollama', label: '⚡ Ollama (offline)' },
            ]}
          />

          <p className="text-[11px] text-gray-400">
            {aiMode === 'groq'
              ? 'Get free API key at console.groq.com → add GROQ_API_KEY to backend .env'
              : 'Run locally: install ollama.com then: ollama pull llama3.2:1b && ollama serve'}
          </p>

          {/* Optional custom prompt */}
          <textarea
            rows={2}
            placeholder="Custom question (optional) — leave blank to auto-analyse today's data"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
          />

          <Button variant="outline" className="w-full" onClick={fetchInsight} disabled={aiLoading}>
            {aiLoading ? <><Spinner size={14} /> Thinking…</> : '◎ Generate Insight'}
          </Button>

          {aiErr && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
              {aiErr}
            </div>
          )}

          {insight && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {aiMode.toUpperCase()} ANALYSIS
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{insight}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="h-2" />
    </div>
  );
}
