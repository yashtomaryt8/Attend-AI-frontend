import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardBody, Spinner } from './ui';
import { api } from '../utils/api';

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 font-mono">{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody className="pt-0">{children}</CardBody>
    </Card>
  );
}

// Always use the Vercel proxy path — never call Railway directly
// This bypasses ISP blocks (Jio etc.) since traffic goes Vercel → Railway server-side
const PROXY_URL = window.location.origin + '/api';

export default function Settings() {
  const [health,    setHealth]    = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetMsg,  setResetMsg]  = useState('');

  useEffect(() => {
    // Call through /api proxy, NOT Railway URL directly
    api.health()
      .then(h => setHealth({ ok: true, users: h.users, hf: h.hf_space }))
      .catch(() => setHealth({ ok: false }));
  }, []);

  const resetPresence = async () => {
    if (!window.confirm('Mark all students as absent? Records are kept.')) return;
    setResetting(true);
    try {
      await api.resetPresence();
      setResetMsg('Done — all students marked absent.');
    } catch (e) { setResetMsg(`Error: ${e.message}`); }
    finally { setResetting(false); }
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">System info &amp; configuration</p>
      </div>

      {/* Backend health — shows Vercel proxy URL, not Railway directly */}
      <Card>
        <CardHeader><CardTitle>Backend</CardTitle></CardHeader>
        <CardBody>
          {health === null ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Spinner size={14} /> Checking…
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{PROXY_URL}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {health.ok
                    ? `${health.users} students registered · via Vercel proxy`
                    : 'Cannot connect — check Railway is running'}
                </p>
                {health.ok && health.hf && (
                  <p className="text-xs text-gray-400 truncate">HF: {health.hf}</p>
                )}
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0
                ${health.ok
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-600 border-red-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${health.ok ? 'bg-green-500' : 'bg-red-500'}`} />
                {health.ok ? 'Online' : 'Offline'}
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Network info */}
      <Card>
        <CardHeader><CardTitle>Network Architecture</CardTitle></CardHeader>
        <CardBody>
          <div className="text-xs text-gray-500 space-y-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
              <span className="text-base">📱</span>
              <div>
                <p className="font-semibold text-gray-700">Your Device</p>
                <p className="text-gray-400">calls /api/* (relative)</p>
              </div>
              <span className="mx-1 text-gray-300">→</span>
              <div>
                <p className="font-semibold text-green-700">Vercel CDN</p>
                <p className="text-gray-400">proxies to Railway</p>
              </div>
              <span className="mx-1 text-gray-300">→</span>
              <div>
                <p className="font-semibold text-gray-700">Railway</p>
                <p className="text-gray-400">Django API</p>
              </div>
            </div>
            <p className="text-gray-400">
              All requests go through Vercel's CDN — ISP blocks (Jio, etc.)
              on Railway's domain don't affect you because your device
              only ever talks to Vercel.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* System specs */}
      <Section title="System">
        <Row label="Face model"    value="InsightFace buffalo_sc" />
        <Row label="Inference"     value="HF Space (free CPU)" />
        <Row label="Scan interval" value="800 ms" />
        <Row label="Backend"       value="Django 5 + DRF" />
        <Row label="Frontend"      value="React 19 + Tailwind" />
        <Row label="Proxy"         value="Vercel → Railway" />
        <Row label="Database"      value="SQLite (portable)" />
      </Section>

      {/* Occlusion tips */}
      <Section title="Better Accuracy">
        <div className="space-y-3 pt-1">
          {[
            { icon: '😷', label: 'Masks',           tip: 'Register with mask on too' },
            { icon: '🕶',  label: 'Glasses',         tip: 'Register with and without' },
            { icon: '⛑',  label: 'Helmet / Hoodie', tip: 'Register while wearing them' },
            { icon: '📐',  label: 'Angles',          tip: 'Front · left · right · tilt' },
            { icon: '🔆',  label: 'Lighting',        tip: 'Bright even light, avoid backlight' },
          ].map(r => (
            <div key={r.label} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-lg leading-none mt-0.5">{r.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Danger zone */}
      <Card className="border-red-100">
        <CardHeader><CardTitle className="text-red-500">Danger Zone</CardTitle></CardHeader>
        <CardBody>
          <p className="text-xs text-gray-500 mb-3">
            Reset marks everyone as absent. Records are not deleted.
          </p>
          {resetMsg && (
            <p className={`text-xs font-medium mb-3 ${resetMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {resetMsg}
            </p>
          )}
          <Button variant="destructive" className="w-full" onClick={resetPresence} disabled={resetting}>
            {resetting ? <><Spinner size={14} /> Resetting…</> : '↺ Reset All Presence'}
          </Button>
        </CardBody>
      </Card>

      <div className="h-2" />
    </div>
  );
}
