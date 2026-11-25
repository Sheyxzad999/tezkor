import { useEffect, useState } from 'react';
import { useLocal, useNow } from '../hooks.ts';
import { useT, type Key } from '../i18n.ts';
import { Section, Empty, Toggle } from '../components/ui.tsx';
import { Icon } from '../components/Icon.tsx';
import {
  CITIES, PRAYER_KEYS, aladhanUrl, islomapiUrl, localDate, nextPrayer, prayerProgress, formatCountdown,
  parseAladhan, parseIslomapi, type DayTimes,
} from '../lib/prayer.ts';

export async function loadPrayerTimes(cityId: string, now = new Date()): Promise<DayTimes> {
  const city = CITIES.find((c) => c.id === cityId) ?? CITIES[0];
  const date = localDate(now);
  try {
    const r = await fetch(islomapiUrl(city));
    if (!r.ok) throw new Error(String(r.status));
    return parseIslomapi(await r.json(), date);
  } catch {
    const r = await fetch(aladhanUrl(city, now));
    return parseAladhan(await r.json(), date);
  }
}

export interface PrayerCache { city: string; data: DayTimes }

/** Oldingi va keyingi namoz orasidagi yoy — nuqta quyosh kabi harakatlanadi */
function Arc({ progress, size = 260 }: { progress: number; size?: number }) {
  const w = size, h = size / 2 + 8, r = size / 2 - 14, cx = w / 2, cy = size / 2;
  const a = Math.PI * (1 - progress);
  const x = cx + r * Math.cos(a), y = cy - r * Math.sin(a);
  const len = Math.PI * r;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="arc-g" x1="0" x2="1">
          <stop offset="0" stopColor="var(--amber)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
        <radialGradient id="sun-g">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.5" stopColor="var(--accent-2)" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--line-2)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="url(#arc-g)" strokeWidth="3" strokeLinecap="round"
        style={{ strokeDasharray: len, strokeDashoffset: len * (1 - progress), transition: 'stroke-dashoffset 1s var(--ease)' }}
      />
      <circle cx={x} cy={y} r="16" fill="url(#sun-g)" opacity="0.55" />
      <circle cx={x} cy={y} r="6" fill="#fff" stroke="var(--accent)" strokeWidth="2.5" />
    </svg>
  );
}

export default function Prayer({ compact }: { compact?: boolean }) {
  const { t } = useT();
  const [city, setCity] = useLocal('prayer.city', 'toshkent');
  const [cache, setCache] = useLocal<PrayerCache | null>('prayer.cache', null);
  const [notify, setNotify] = useLocal('prayer.notify', false);
  const [error, setError] = useState(false);
  const now = useNow(1000);
  const today = localDate(now);
  const fresh = cache && cache.city === city && cache.data.date === today;

  useEffect(() => {
    if (fresh) return;
    let alive = true;
    setError(false);
    loadPrayerTimes(city)
      .then((data) => alive && setCache({ city, data }))
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [city, today, fresh, setCache]);

  async function toggleNotify(v: boolean) {
    if (v) {
      try {
        const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');
        if (!(await isPermissionGranted()) && (await requestPermission()) !== 'granted') return;
      } catch { /* brauzerda */ }
    }
    setNotify(v);
  }

  const citySelect = (
    <select className="select" value={city} onChange={(e) => setCity(e.target.value)}>
      {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );

  const data = cache?.city === city ? cache.data : null;
  if (!data) {
    return (
      <div className="widget prayer">
        <div className="row"><span className="grow" />{citySelect}</div>
        <Empty>{error ? t('common.offline') : t('common.loading')}</Empty>
      </div>
    );
  }

  const np = nextPrayer(data.times, now);
  const label = (k: string) => t(`pr.${k}` as Key);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const past = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m <= nowMin; };

  return (
    <div className="widget prayer">
      <div className="row">
        <span className="muted small grow">{data.hijri ?? ''}</span>
        {citySelect}
      </div>

      <div className="hero">
        <div className="arc-wrap">
          <Arc progress={prayerProgress(data.times, now)} size={compact ? 220 : 268} />
          <div className="arc-center">
            <span className="lbl">{label(np.next)} · {data.times[np.next]}</span>
            <span className="big">{formatCountdown(np.minutesLeft)}</span>
            <span className="sub">{t('pr.left')}</span>
          </div>
        </div>
      </div>

      <Section>
        <div className="timeline">
          {PRAYER_KEYS.map((k) => (
            <div key={k} className={`tl-item ${k === np.next ? 'is-next' : !np.tomorrow && past(data.times[k]) ? 'is-past' : ''}`}>
              <i className="tl-dot" />
              <span className="tl-name">{label(k)}</span>
              <b className="tl-time mono">{data.times[k]}</b>
            </div>
          ))}
        </div>
      </Section>

      {!compact && (
        <Section>
          <Toggle checked={notify} onChange={toggleNotify} label={<><Icon name="bell" size={16} /> {t('pr.notify')}</>} />
          <p className="hint">{t(data.source === 'islomapi' ? 'pr.source.islomapi' : 'pr.source.aladhan')}</p>
        </Section>
      )}
    </div>
  );
}
