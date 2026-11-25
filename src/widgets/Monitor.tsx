import { useState } from 'react';
import { useInterval } from '../hooks.ts';
import { useT } from '../i18n.ts';
import { Section, Ring, Sparkline, Empty } from '../components/ui.tsx';
import { Icon } from '../components/Icon.tsx';
import { invoke, isTauri } from '../env.ts';

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

const level = (p: number) => (p > 85 ? 'var(--danger)' : p > 65 ? 'var(--warn)' : 'var(--accent)');

export default function Monitor({ compact }: { compact?: boolean }) {
  const { t } = useT();
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cpuH, setCpuH] = useState<number[]>([]);
  const [rxH, setRxH] = useState<number[]>([]);
  const [txH, setTxH] = useState<number[]>([]);

  useInterval(async () => {
    if (!isTauri) return;
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
  }, 1500);

  if (!isTauri) return <Empty>{t('common.onlyApp')}</Empty>;
  if (err) return <Empty>{t('common.error')}: {err}</Empty>;
  if (!s) return <Empty>{t('common.loading')}</Empty>;

  const memPct = (s.memUsed / s.memTotal) * 100;

  return (
    <div className="widget monitor">
      <Section title={compact ? undefined : t('mon.title')} right={!compact && s.host ? <span className="muted small">{s.host}</span> : undefined}>
        <div className="rings">
          <Ring value={s.cpu} label={t('mon.cpu')} sub={`${s.cores.length} yadro`} color={level(s.cpu)} />
          <Ring value={memPct} label={t('mon.ram')} sub={`${bytes(s.memUsed)} / ${bytes(s.memTotal)}`} color={level(memPct)} />
        </div>
        {!compact && <Sparkline data={cpuH} color={level(s.cpu)} />}
      </Section>

      <Section title={compact ? undefined : t('mon.net')}>
        <div className="net">
          <div className="net-item down">
            <Icon name="arrowDown" size={15} />
            <b className="mono">{bytes(s.netRx, true)}</b>
          </div>
          <div className="net-item up">
            <Icon name="arrowUp" size={15} />
            <b className="mono">{bytes(s.netTx, true)}</b>
          </div>
        </div>
        {!compact && (
          <div className="net-graphs">
            <Sparkline data={rxH} max={1} height={32} color="var(--accent)" />
            <Sparkline data={txH} max={1} height={32} color="var(--accent-2)" />
          </div>
        )}
      </Section>

      {!compact && (
        <>
          {s.cores.length > 1 && (
            <Section title="Yadrolar">
              <div className="cores">
                {s.cores.map((c, i) => (
                  <div key={i} className="core" title={`#${i + 1}: ${c.toFixed(0)}%`}>
                    <i style={{ height: `${Math.max(4, c)}%`, background: level(c) }} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title={t('mon.disks')}>
            {s.disks.map((d) => {
              const used = d.total - d.available;
              const pct = (used / d.total) * 100;
              return (
                <div key={d.mount} className="disk">
                  <div className="disk-head">
                    <b>{d.name || d.mount}</b>
                    <span className="muted small">{bytes(d.available)} {t('mon.free')}</span>
                  </div>
                  <div className="bar"><i style={{ width: `${pct}%`, background: level(pct) }} /></div>
                  <div className="muted small">{bytes(used)} / {bytes(d.total)} · {d.mount}</div>
                </div>
              );
            })}
          </Section>

          <p className="hint">{t('mon.uptime')}: {uptimeText(s.uptime)}{s.os ? ` · ${s.os}` : ''}</p>
        </>
      )}
    </div>
  );
}
