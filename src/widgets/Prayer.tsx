import { useEffect, useState } from 'react';
import { useLocal, useNow } from '../hooks.ts';
import { useT, type Key } from '../i18n.ts';
import { Section, Empty, Toggle } from '../components/ui.tsx';
import { Icon } from '../components/Icon.tsx';
import {
  CITIES, PRAYER_KEYS, aladhanUrl, islomapiUrl, localDate, nextPrayer, formatCountdown,
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
        <Section right={citySelect}>
          <Empty>{error ? t('common.offline') : t('common.loading')}</Empty>
        </Section>
      </div>
    );
  }

  const np = nextPrayer(data.times, now);
  const label = (k: string) => t(`pr.${k}` as Key);

  return (
    <div className="widget prayer">
      <Section title={compact ? undefined : t('pr.title')} right={citySelect}>
        <div className="prayer-hero">
          <span className="muted small">{t('pr.next')}</span>
          <b>{label(np.next)} · <span className="mono">{data.times[np.next]}</span></b>
          <div className="countdown mono">{formatCountdown(np.minutesLeft)}</div>
          <span className="muted small">{t('pr.left')}{data.hijri ? ` · ${data.hijri}` : ''}</span>
        </div>
        <div className="prayer-list">
          {PRAYER_KEYS.map((k) => (
            <div key={k} className={`prayer-item ${k === np.current && !np.tomorrow ? 'is-current' : ''} ${k === np.next ? 'is-next' : ''}`}>
              <span>{label(k)}</span>
              <b className="mono">{data.times[k]}</b>
            </div>
          ))}
        </div>
      </Section>
      {!compact && (
        <Section>
          <Toggle checked={notify} onChange={toggleNotify} label={<><Icon name="bell" size={15} /> {t('pr.notify')}</>} />
          <p className="hint">{t(data.source === 'islomapi' ? 'pr.source.islomapi' : 'pr.source.aladhan')}</p>
        </Section>
      )}
    </div>
  );
}
