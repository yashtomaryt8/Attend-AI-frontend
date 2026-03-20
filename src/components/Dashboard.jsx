import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardHeader, CardTitle, CardBody, Stat, Badge, Spinner, Empty } from './ui';
import { api } from '../utils/api';

function Bar({ data, maxH = 64, highlight = true }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: maxH + 20 }}>
      {data.map((d, i) => {
        const h   = Math.max(Math.round((d.count / max) * maxH), d.count > 0 ? 3 : 0);
        const hot = highlight && i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            {d.count > 0 && <span className="text-[9px] text-gray-400 font-mono leading-none">{d.count}</span>}
            <div
              className={`w-full rounded-sm ${hot ? 'bg-gray-900' : 'bg-gray-200'} transition-all`}
              style={{ height: h || 2, opacity: hot ? 1 : 0.7 }}
              title={`${d.label ?? d.date}: ${d.count}`}
            />
            <span className="text-[9px] text-gray-400 leading-none">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ setTab }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api.analytics());
      setErr('');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-48"><Spinner size={24} /></div>
  );

  if (err) return (
    <div className="p-4 flex flex-col gap-3">
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
        ⚠ {err} — is the backend running?
      </div>
      <Button variant="outline" onClick={load}>Retry</Button>
    </div>
  );

  const {
    total_users = 0, present_now = 0, present_today = 0,
    attendance_rate = 0, late_today = 0,
    week_data = [], week_avg = 0, hourly_data = [],
    peak_hour = '—', top_attendees = [],
    present_users = [], avg_duration_min = null,
  } = data || {};

  const rateColor = attendance_rate >= 75
    ? 'bg-green-500'
    : attendance_rate >= 50 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>↺</Button>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <Button className="flex-1" size="sm" onClick={() => setTab('scanner')}>◎ Open Scanner</Button>
        <Button className="flex-1" size="sm" variant="outline" onClick={() => setTab('register')}>+ Register</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Registered"    value={total_users}   sub="students total" />
        <Stat label="Present Now"   value={present_now}   sub="in room"        valueClass="text-green-600" />
        <Stat label="Today"         value={present_today} sub={`of ${total_users}`} />
        <Stat label="Late Arrivals" value={late_today}    sub="after 9:00 AM"  valueClass="text-amber-600" />
      </div>

      {/* Attendance rate */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Attendance Rate</p>
            <span className="text-lg font-bold text-gray-900">{attendance_rate}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${rateColor}`} style={{ width: `${attendance_rate}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-gray-400">
            <span>Weekly avg {week_avg}/day</span>
            {avg_duration_min && <span>Avg session {avg_duration_min} min</span>}
          </div>
        </CardBody>
      </Card>

      {/* 7-day */}
      <Card>
        <CardBody>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">7-Day Trend</p>
          <Bar data={week_data} maxH={64} />
        </CardBody>
      </Card>

      {/* Hourly */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hourly Today</p>
            <span className="text-[11px] text-gray-400">Peak {peak_hour}</span>
          </div>
          <Bar data={hourly_data.map(d => ({ ...d, label: `${d.hour}` }))} maxH={40} highlight={false} />
        </CardBody>
      </Card>

      {/* Present now */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Currently Present</CardTitle>
            <Badge variant={present_now > 0 ? 'green' : 'default'}>{present_now} in room</Badge>
          </div>
        </CardHeader>
        {present_users.length === 0 ? (
          <Empty icon="○" title="Nobody present" sub="Open scanner to start marking attendance" />
        ) : (
          <CardBody className="pt-2">
            <div className="flex flex-wrap gap-1.5">
              {present_users.map(u => (
                <span key={u.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {u.name}
                </span>
              ))}
            </div>
          </CardBody>
        )}
      </Card>

      {/* Top attendees */}
      {top_attendees.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top Attendees</CardTitle></CardHeader>
          <div className="divide-y divide-gray-50">
            {top_attendees.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs w-5 text-center">{i === 0 ? '🥇' : `#${i + 1}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.user__name}</p>
                  {t.user__student_id && <p className="text-[11px] text-gray-400">{t.user__student_id}</p>}
                </div>
                <span className="text-xs font-bold text-gray-900 font-mono">{t.total} sessions</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="h-2" />
    </div>
  );
}
