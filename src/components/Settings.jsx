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

export default function Settings() {
  const [health,     setHealth]     = useState(null);
  const [resetting,  setResetting]  = useState(false);
  const [resetMsg,   setResetMsg]   = useState('');

  useEffect(() => {
    api.health()
      .then(h => setHealth({ ok: true, users: h.users }))
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

      {/* Backend health */}
      <Card>
        <CardHeader><CardTitle>Backend</CardTitle></CardHeader>
        <CardBody>
          {health === null ? (
            <div className="flex items-center gap-2 text-sm text-gray-400"><Spinner size={14} /> Checking…</div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {health.ok ? `${health.users} students registered` : 'Cannot connect to backend'}
                </p>
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border
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

      {/* System specs */}
      <Section title="System">
        <Row label="Face model"      value="InsightFace buffalo_sc" />
        <Row label="Inference"       value="CPU-only (onnxruntime)" />
        <Row label="Model size"      value="~100 MB (downloads once)" />
        <Row label="Scan interval"   value="800 ms" />
        <Row label="Camera"          value="object-fit: contain" />
        <Row label="Backend"         value="Django 5 + DRF" />
        <Row label="Frontend"        value="React 19 + Tailwind" />
        <Row label="Database"        value="SQLite (portable)" />
      </Section>

      {/* Free deployment */}
      <Section title="Free Deployment">
        <div className="space-y-4 pt-1">
          {[
            {
              label: 'Backend → Railway.app',
              color: 'text-violet-600',
              steps: [
                'Sign up free at railway.app',
                'New project → Deploy from GitHub',
                'Root dir: backend, Railway reads Procfile',
                'Add env: SECRET_KEY, GROQ_API_KEY, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS',
              ],
            },
            {
              label: 'Frontend → Vercel',
              color: 'text-blue-600',
              steps: [
                'Sign up free at vercel.com',
                'Import GitHub repo, root dir: frontend',
                'Add env: REACT_APP_API_URL=https://your-app.railway.app/api',
                'Deploy → shareable HTTPS link, works on mobile',
              ],
            },
            {
              label: 'AI → Free options',
              color: 'text-emerald-600',
              steps: [
                'Groq: free 14k req/day — console.groq.com',
                'Ollama: 100% offline — ollama.com',
                'Model: llama3.2:1b (~700MB, runs on i7-3770)',
                'Set GROQ_API_KEY in backend .env',
              ],
            },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-xs font-bold mb-1.5 ${s.color}`}>{s.label}</p>
              <ol className="space-y-1 list-decimal list-inside">
                {s.steps.map((step, i) => (
                  <li key={i} className="text-xs text-gray-500">{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      {/* Occlusion tips */}
      <Section title="Better Occlusion Accuracy">
        <div className="space-y-3 pt-1">
          {[
            { icon: '😷', label: 'Masks',          tip: 'Register 2–3 photos with mask on' },
            { icon: '🕶',  label: 'Glasses',        tip: 'Register with glasses AND without' },
            { icon: '⛑',  label: 'Helmet / Hoodie', tip: 'Register while wearing them' },
            { icon: '📐',  label: 'Angles',         tip: 'Front · left · right · tilt · up · down' },
            { icon: '🔆',  label: 'Lighting',       tip: 'Bright, even — avoid strong backlight' },
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
            Reset marks everyone as absent for today. Attendance records are not deleted.
          </p>
          {resetMsg && (
            <p className={`text-xs font-medium mb-3 ${resetMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {resetMsg}
            </p>
          )}
          <Button
            variant="destructive"
            className="w-full"
            onClick={resetPresence}
            disabled={resetting}
          >
            {resetting ? <><Spinner size={14} /> Resetting…</> : '↺ Reset All Presence'}
          </Button>
        </CardBody>
      </Card>

      <div className="h-2" />
    </div>
  );
}
