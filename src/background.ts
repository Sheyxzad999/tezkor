/**
 * Asosiy oynada doim ishlaydigan fon xizmatlari (oyna yashirin boʻlsa ham).
 */
import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { isTauri, readClipboard, copyText, toast } from './env.ts';
import { readLocal, writeLocal, useInterval } from './hooks.ts';
import { addClip, type ClipItem } from './lib/clipboard.ts';
import { PRAYER_KEYS, localDate } from './lib/prayer.ts';
import { loadPrayerTimes, type PrayerCache } from './widgets/Prayer.tsx';
import { translate, type Lang, type Key } from './i18n.ts';

/** Clipboard tarixini yigʻadi */
export function useClipboardWatcher() {
  const last = useRef<string | null>(null);
  useInterval(async () => {
    if (!isTauri || readLocal('clip.paused', false)) return;
    const text = await readClipboard();
    if (text === null || text === last.current) return;
    last.current = text;
    const items = readLocal<ClipItem[]>('clip.items', []);
    const next = addClip(items, text);
    if (next !== items) writeLocal('clip.items', next);
  }, 1000);
}

/** Global tugma (Alt+Shift+C) bilan olingan rangni qabul qiladi */
export function useColorHotkey() {
  useEffect(() => {
    if (!isTauri) return;
    const unsubs = [
      listen<string>('color-picked', (e) => {
        const hex = e.payload;
        writeLocal('color.current', hex);
        const h = readLocal<string[]>('color.history', []);
        writeLocal('color.history', [hex, ...h.filter((x) => x !== hex)].slice(0, 18));
        copyText(hex);
      }),
      listen<string>('color-error', (e) => toast('Rang olinmadi', e.payload)),
    ];
    return () => { unsubs.forEach((p) => p.then((f) => f())); };
  }, []);
}

/** Namoz vaqti kirganda bildirishnoma yuboradi */
export function usePrayerNotifier() {
  useInterval(async () => {
    if (!isTauri || !readLocal('prayer.notify', false)) return;
    const now = new Date();
    const today = localDate(now);
    const city = readLocal('prayer.city', 'toshkent');
    let cache = readLocal<PrayerCache | null>('prayer.cache', null);
    if (!cache || cache.city !== city || cache.data.date !== today) {
      try {
        cache = { city, data: await loadPrayerTimes(city, now) };
        writeLocal('prayer.cache', cache);
      } catch { return; }
    }
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const key = PRAYER_KEYS.find((k) => k !== 'sunrise' && cache!.data.times[k] === hhmm);
    if (!key) return;
    const stamp = `${today}-${key}`;
    if (readLocal('prayer.lastNotified', '') === stamp) return;
    writeLocal('prayer.lastNotified', stamp);
    const lang = readLocal<Lang>('lang', 'uz');
    const { sendNotification } = await import('@tauri-apps/plugin-notification');
    sendNotification({
      title: `🕌 ${translate(lang, `pr.${key}` as Key)} · ${hhmm}`,
      body: `${translate(lang, `pr.${key}` as Key)} ${translate(lang, 'pr.notifyBody')}`,
    });
  }, 20_000);
}
