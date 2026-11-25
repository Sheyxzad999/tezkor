import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from './Icon.tsx';
import { copyText } from '../env.ts';

export function Section({ title, right, children }: { title?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
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

/** Halqa koʻrinishidagi koʻrsatkich (0–100) */
export function Ring({ value, label, sub, size = 92, color = 'var(--accent)' }: {
  value: number; label: string; sub?: string; size?: number; color?: string;
}) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ width: size, ['--size' as string]: `${size}px` }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          className="ring-value"
          style={{ stroke: color, strokeDasharray: c, strokeDashoffset: c * (1 - v / 100) }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-text">
        <b>{Math.round(v)}<small>%</small></b>
        <span>{label}</span>
      </div>
      {sub && <div className="ring-sub">{sub}</div>}
    </div>
  );
}

/** Kichik chiziqli grafik */
export function Sparkline({ data, max = 100, height = 40, color = 'var(--accent)' }: {
  data: number[]; max?: number; height?: number; color?: string;
}) {
  const w = 300;
  const m = Math.max(max, ...data, 1);
  const pts = data.map((d, i) => `${(i / Math.max(1, data.length - 1)) * w},${height - (d / m) * (height - 2) - 1}`);
  const id = `g${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" height={height}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {pts.length > 1 && (
        <>
          <polygon points={`0,${height} ${pts.join(' ')} ${w},${height}`} fill={`url(#${id})`} />
          <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
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
