import React from 'react';

// ── Button ────────────────────────────────────────────────────────
const variantMap = {
  default:   'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950',
  outline:   'border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100 bg-white',
  ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  destructive: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
};
const sizeMap = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export function Button({ variant = 'default', size = 'md', className = '', disabled, children, ...props }) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg transition-colors
        disabled:opacity-40 disabled:pointer-events-none
        ${variantMap[variant] || variantMap.default}
        ${sizeMap[size] || sizeMap.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────
export function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }) {
  return <div className={`px-4 pt-4 pb-3 border-b border-gray-100 ${className}`}>{children}</div>;
}

export function CardTitle({ className = '', children }) {
  return <p className={`text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}>{children}</p>;
}

export function CardBody({ className = '', children }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

// ── Badge ─────────────────────────────────────────────────────────
const badgeVariants = {
  default:  'bg-gray-100 text-gray-700',
  green:    'bg-green-50 text-green-700 border border-green-200',
  yellow:   'bg-amber-50 text-amber-700 border border-amber-200',
  red:      'bg-red-50 text-red-600 border border-red-200',
  blue:     'bg-blue-50 text-blue-700 border border-blue-200',
};

export function Badge({ variant = 'default', className = '', children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${badgeVariants[variant] || badgeVariants.default} ${className}`}>
      {children}
    </span>
  );
}

// ── Input ─────────────────────────────────────────────────────────
export function Input({ label, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>}
      <input
        className={`h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}

export function Select({ label, className = '', children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>}
      <select
        className={`h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>}
      <textarea
        className={`px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors resize-none ${className}`}
        {...props}
      />
    </div>
  );
}

// ── Stat box ──────────────────────────────────────────────────────
export function Stat({ label, value, sub, valueClass = 'text-gray-900' }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size = 16 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="animate-spin"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Divider ───────────────────────────────────────────────────────
export function Divider() {
  return <div className="h-px bg-gray-100 my-1" />;
}

// ── Empty state ───────────────────────────────────────────────────
export function Empty({ icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
      {icon && <div className="text-3xl mb-3 opacity-40">{icon}</div>}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {sub && <p className="text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────
export function Toggle({ value, options, onChange }) {
  // options: [{value, label}]
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 h-7 px-3 text-xs font-semibold rounded-md transition-all
            ${value === opt.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'}
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
