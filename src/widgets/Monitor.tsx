import { useState } from 'react';
import { useInterval } from '../hooks.ts';
import { useT } from '../i18n.ts';
import { Section, Ring, Sparkline, Empty } from '../components/ui.tsx';
import { Icon } from '../components/Icon.tsx';
import { invoke } from '../env.ts';

interface Disk { name: string; mount: string; total: number; available: number; removable: boolean }
interface Stats {
  cpu: number; cores: number[]; memUsed: number; memTotal: number; swapUsed: number; swapTotal: number;
  netRx: number; netTx: number; disks: Disk[]; uptime: number; host?: string; os?: string;
}

const HISTORY = 60;

export function bytes(n: number, perSec = false) {
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${u[i]}${perSec ? '/s' : ''}`;
}

function uptimeText(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return [d && `${d} kun`, h && `${h} soat`, `${m} daq`].filter(Boolean).join(' ');
}

const barColor = (p: number) =>
  p > 88 ? 'var(--danger)' : 'linear-gradient(90deg, var(--amber), var(--accent))';

export default function Monitor({ compact }: { compact?: boolean }) {
  const { t } = useT();
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cpuH, setCpuH] = useState<number[]>([]);
  const [rxH, setRxH] = useState<number[]>([]);
  const [txH, setTxH] = useState<number[]>([]);

  useInterval(async () => {
    try {
      const n = await invoke<Stats>('system_stats');
      setS(n);
      setErr(null);
      setCpuH((h) => [...h, n.cpu].slice(-HISTORY));
      setRxH((h) => [...h, n.netRx].slice(-HISTORY));
      setTxH((h) => [...h, n.netTx].slice(-HISTORY));
    } catch (e) {
      setErr(String(e));
    }
  }, 1200);

  if (err) return <Empty>{t('common.error')}: {err}</Empty>;
  if (!s) return <Empty>{t('common.loading')}</Empty>;

  const memPct = (s.memUsed / s.memTotal) * 100;
  const ringSize = compact ? 84 : 104;

  return (
    <div className="widget monitor">
      <div className="rings">
        <Section className="ring-card">
          <Ring value={s.cpu} size={ringSize} danger={s.cpu > 88} />
          <span className="ring-label">{t('mon.cpu')}</span>
          <span className="ring-sub">{s.cores.length} {t('mon.cores')}</span>
        </Section>
        <Section className="ring-card">
          <Ring value={memPct} size={ringSize} danger={memPct > 88} />
          <span className="ring-label">{t('mon.ram')}</span>
          <span className="ring-sub">{bytes(s.memUsed)} / {bytes(s.memTotal)}</span>
        </Section>
      </div>

      {!compact && (
        <Section title={`${t('mon.cpu')} · 60 s`} right={<span className="mono small muted">{s.cpu.toFixed(0)}%</span>}>
          <Sparkline data={cpuH} height={56} color="var(--accent)" />
          {s.cores.length > 1 && (
            <div className="cores">
              {s.cores.map((c, i) => (
                <div key={i} className="core" title={`#${i + 1}: ${c.toFixed(0)}%`}>
                  <i style={{ height: `${Math.max(6, c)}%`, background: c > 88 ? 'var(--danger)' : 'linear-gradient(0deg, var(--accent), var(--amber))' }} />
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      <Section>
        <div className="net">
          <div className="net-tile">
            <div className="row"><i className="net-dot" style={{ background: 'var(--accent)' }} /><span className="lbl">{t('mon.down')}</span></div>
            <b className="mono">{bytes(s.netRx, true)}</b>
            {!compact && <Sparkline data={rxH} max={1} height={30} color="var(--accent)" />}
          </div>
          <div className="net-tile">
            <div className="row"><i className="net-dot" style={{ background: 'var(--amber)' }} /><span className="lbl">{t('mon.up')}</span></div>
            <b className="mono">{bytes(s.netTx, true)}</b>
            {!compact && <Sparkline data={txH} max={1} height={30} color="var(--amber)" />}
          </div>
        </div>
      </Section>

      {!compact && (
        <>
          <Section title={t('mon.disks')}>
            {s.disks.map((d) => {
              const used = d.total - d.available;
              const pct = (used / d.total) * 100;
              return (
                <div key={d.mount} className="disk">
                  <div className="disk-head">
                    <b className="row-tight"><Icon name="monitor" size={13} /> {d.name || d.mount}</b>
                    <span className="muted small mono">{bytes(d.available)} {t('mon.free')}</span>
                  </div>
                  <div className="bar"><i style={{ width: `${pct}%`, background: barColor(pct) }} /></div>
                  <div className="muted small">{bytes(used)} / {bytes(d.total)}</div>
                </div>
              );
            })}
          </Section>
          <p className="hint" style={{ padding: '0 4px' }}>
            {s.host ? `${s.host} · ` : ''}{s.os ? `${s.os} · ` : ''}{t('mon.uptime')}: {uptimeText(s.uptime)}
          </p>
        </>
      )}
    </div>
  );
}
