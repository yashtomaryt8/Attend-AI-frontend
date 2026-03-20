import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import Register from './components/Register';
import Logs from './components/Logs';
import Analytics from './components/Analytics';
import Settings from './components/Settings';

const TABS = [
  { id: 'dashboard', label: 'Home',     icon: '○' },
  { id: 'scanner',   label: 'Scan',     icon: '◎' },
  { id: 'register',  label: 'Register', icon: '+' },
  { id: 'logs',      label: 'Logs',     icon: '≡' },
  { id: 'analytics', label: 'Stats',    icon: '◇' },
  { id: 'settings',  label: 'Config',   icon: '⚙' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');

  const pages = {
    dashboard: <Dashboard setTab={setTab} />,
    scanner:   <Scanner />,
    register:  <Register />,
    logs:      <Logs />,
    analytics: <Analytics />,
    settings:  <Settings />,
  };

  return (
    <div className="flex flex-col h-dvh max-w-lg mx-auto bg-white border-x border-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-900 rounded-md flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">AI</span>
          </div>
          <span className="text-sm font-bold tracking-tight">AttendAI</span>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        {pages[tab] || pages.dashboard}
      </main>

      {/* Bottom nav */}
      <nav className="flex border-t border-gray-100 h-14 flex-shrink-0 bg-white">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`
              flex-1 flex flex-col items-center justify-center gap-0.5
              text-[10px] font-semibold tracking-widest uppercase
              transition-colors
              ${tab === t.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}
            `}
          >
            <span className={`text-[15px] leading-none ${tab === t.id ? '' : 'opacity-60'}`}>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
