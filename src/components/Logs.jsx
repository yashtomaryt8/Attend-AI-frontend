import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Badge, Spinner, Empty } from './ui';
import { api } from '../utils/api';

function today() { return new Date().toISOString().slice(0, 10); }

// Safely extract array from any API response shape
function toArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export default function Logs() {
  const [tab,     setTab]     = useState('logs');
  const [logs,    setLogs]    = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');
  const [filters, setFilters] = useState({ name: '', event: '', date: today() });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (filters.name)  params.name  = filters.name;
      if (filters.event) params.event = filters.event;
      if (filters.date)  params.date  = filters.date;
      const [l, u] = await Promise.all([api.logs(params), api.users()]);
      setLogs(toArray(l));
      setUsers(toArray(u));
      setErr('');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try { await api.deleteUser(id); load(); } catch (e) { setErr(e.message); }
  };

  const exportCSV = async () => {
    try {
      const res  = await api.exportCSV(filters.date || today());
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `attendance_${filters.date}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setErr(e.message); }
  };

  const sf = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">Logs & Students</h1>
        <p className="text-xs text-gray-400 mt-0.5">Filter, export, and manage records</p>
      </div>

      {/* Tab */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
        {[['logs', `Logs (${logs.length})`], ['users', `Students (${users.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 h-7 text-xs font-semibold rounded-md transition-all ${tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {err && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-600">{err}</div>}

      {/* Filters */}
      {tab === 'logs' && (
        <Card>
          <CardBody className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Search name…" value={filters.name} onChange={e => sf('name', e.target.value)} />
              <Select value={filters.event} onChange={e => sf('event', e.target.value)}>
                <option value="">All events</option>
                <option value="entry">Entry</option>
                <option value="exit">Exit</option>
              </Select>
            </div>
            <div className="flex gap-2">
              <input type="date" value={filters.date} onChange={e => sf('date', e.target.value)}
                className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
              <Button variant="outline" size="sm" onClick={exportCSV}>↓ CSV</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Logs table */}
      {tab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>{loading ? 'Loading…' : `${logs.length} Records`}</CardTitle>
          </CardHeader>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Spinner /></div>
          ) : logs.length === 0 ? (
            <Empty icon="≡" title="No records" sub="Try changing the filters" />
          ) : (
            <div className="divide-y divide-gray-50 overflow-x-auto">
              <table className="w-full text-xs min-w-[420px]">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'ID', 'Dept', 'Event', 'Time', 'Conf%'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">{l.user_name}</td>
                      <td className="px-3 py-2 text-gray-500 font-mono">{l.user_student_id || '—'}</td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{l.department || '—'}</td>
                      <td className="px-3 py-2">
                        <Badge variant={l.event_type === 'entry' ? 'green' : 'yellow'}>{l.event_type}</Badge>
                      </td>
                      <td className="px-3 py-2 text-gray-500 font-mono whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-3 py-2 text-gray-500 font-mono">
                        {l.confidence ? `${(l.confidence * 100).toFixed(0)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Users table */}
      {tab === 'users' && (
        <Card>
          <CardHeader><CardTitle>{users.length} Registered Students</CardTitle></CardHeader>
          {users.length === 0 ? (
            <Empty icon="+" title="No students registered" />
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {[u.student_id, u.department].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={u.photo_count >= 5 ? 'green' : 'yellow'}>{u.photo_count}p</Badge>
                    <Badge variant={u.is_present ? 'green' : 'default'}>{u.is_present ? 'In' : 'Out'}</Badge>
                    <button onClick={() => deleteUser(u.id, u.name)}
                      className="w-6 h-6 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 text-xs flex items-center justify-center transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="h-2" />
    </div>
  );
}
