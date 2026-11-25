import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Icon } from './Icon.tsx';
import { copyText } from '../env.ts';

export function Section({ title, right, children, plain, className }: {
  title?: ReactNode; right?: ReactNode; children: ReactNode; plain?: boolean; className?: string;
}) {
  return (
    <section className={`section ${plain ? 'plain' : ''} ${className ?? ''}`}>
      {(title || right) && (
        <header className="section-head">
          <h3>{title}</h3>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 1200);
    return () => clearTimeout(id);
  }, [done]);
  return (
    <button
      className={`icon-btn ${done ? 'is-done' : ''}`}
      title={label ?? 'Nusxa'}
      onClick={(e) => {
        e.stopPropagation();
        copyText(value).then(() => setDone(true));
      }}
    >
      <Icon name={done ? 'check' : 'copy'} size={15} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} className={o.value === value ? 'is-active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

/** Halqa koʻrinishidagi koʻrsatkich (0–100), gradientli */
export function Ring({ value, size = 104, stroke = 9, danger }: { value: number; size?: number; stroke?: number; danger?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const id = useMemo(() => `rg${Math.random().toString(36).slice(2, 7)}`, []);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={danger ? 'var(--danger)' : 'var(--amber)'} />
            <stop offset="1" stopColor={danger ? 'var(--danger)' : 'var(--accent)'} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          className="ring-value"
          strokeWidth={stroke}
          stroke={`url(#${id})`}
          style={{ strokeDasharray: c, strokeDashoffset: c * (1 - v / 100), filter: `drop-shadow(0 0 6px color-mix(in srgb, ${danger ? 'var(--danger)' : 'var(--accent)'} 45%, transparent))` }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-text">
        <b>{Math.round(v)}<small>%</small></b>
      </div>
    </div>
  );
}

/** Sahifa sarlavhasi — sayt uslubidagi katta tipografika */
export function PageHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <header className="page-head">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {desc && <p>{desc}</p>}
    </header>
  );
}

/** Kichik chiziqli grafik */
export function Sparkline({ data, max = 100, height = 40, color = 'var(--accent)' }: {
  data: number[]; max?: number; height?: number; color?: string;
}) {
  const w = 300;
  const m = Math.max(max, ...data, 1);
  const pts = data.map((d, i) => `${(i / Math.max(1, data.length - 1)) * w},${height - (d / m) * (height - 2) - 1}`);
  const id = useMemo(() => `g${Math.random().toString(36).slice(2, 7)}`, []);
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" height={height}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {pts.length > 1 && (
        <>
          <polygon points={`0,${height} ${pts.join(' ')} ${w},${height}`} fill={`url(#${id})`} />
          <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </>
      )}
    </svg>
  );
}

export function Toasts() {
  const [items, setItems] = useState<{ id: number; title: string; body?: string }[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const { title, body } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setItems((l) => [...l.slice(-2), { id, title, body }]);
      setTimeout(() => setItems((l) => l.filter((i) => i.id !== id)), 2200);
    };
    window.addEventListener('tezkor-toast', on);
    return () => window.removeEventListener('tezkor-toast', on);
  }, []);
  return (
    <div className="toasts" aria-live="polite">
      {items.map((i) => (
        <div key={i.id} className="toast">
          <Icon name="check" size={14} />
          <b>{i.title}</b>
          {i.body && <span>{i.body}</span>}
        </div>
      ))}
    </div>
  );
}
