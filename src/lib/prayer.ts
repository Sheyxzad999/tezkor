export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const PRAYER_KEYS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export interface City { id: string; name: string; islomapi: string; lat: number; lon: number }

export const CITIES: City[] = [
  { id: 'toshkent', name: 'Toshkent', islomapi: 'Toshkent', lat: 41.2995, lon: 69.2401 },
  { id: 'andijon', name: 'Andijon', islomapi: 'Andijon', lat: 40.7821, lon: 72.3442 },
  { id: 'namangan', name: 'Namangan', islomapi: 'Namangan', lat: 40.9983, lon: 71.6726 },
  { id: 'fargona', name: 'Fargʻona', islomapi: "Farg'ona", lat: 40.3864, lon: 71.7864 },
  { id: 'qoqon', name: 'Qoʻqon', islomapi: "Qo'qon", lat: 40.5286, lon: 70.9425 },
  { id: 'samarqand', name: 'Samarqand', islomapi: 'Samarqand', lat: 39.6542, lon: 66.9597 },
  { id: 'buxoro', name: 'Buxoro', islomapi: 'Buxoro', lat: 39.7681, lon: 64.4556 },
  { id: 'navoiy', name: 'Navoiy', islomapi: 'Navoiy', lat: 40.0844, lon: 65.3792 },
  { id: 'jizzax', name: 'Jizzax', islomapi: 'Jizzax', lat: 40.1158, lon: 67.8422 },
  { id: 'guliston', name: 'Guliston', islomapi: 'Guliston', lat: 40.4897, lon: 68.7842 },
  { id: 'qarshi', name: 'Qarshi', islomapi: 'Qarshi', lat: 38.8606, lon: 65.7891 },
  { id: 'termiz', name: 'Termiz', islomapi: 'Termiz', lat: 37.2242, lon: 67.2783 },
  { id: 'urganch', name: 'Urganch', islomapi: 'Urganch', lat: 41.55, lon: 60.6333 },
  { id: 'xiva', name: 'Xiva', islomapi: 'Xiva', lat: 41.3783, lon: 60.3639 },
  { id: 'nukus', name: 'Nukus', islomapi: 'Nukus', lat: 42.4531, lon: 59.6103 },
];

export interface DayTimes {
  /** "HH:MM" */
  times: Record<PrayerKey, string>;
  hijri?: string;
  source: 'islomapi' | 'aladhan';
  /** "YYYY-MM-DD" — qaysi kun uchun */
  date: string;
}

const HHMM = /^(\d{1,2}):(\d{2})/;
const norm = (v: unknown) => {
  const m = String(v ?? '').match(HHMM);
  if (!m) throw new Error(`Vaqt notoʻgʻri: ${v}`);
  return `${m[1].padStart(2, '0')}:${m[2]}`;
};

/** islomapi.uz /api/present/day javobi */
export function parseIslomapi(json: any, date: string): DayTimes {
  const t = json?.times;
  if (!t) throw new Error('islomapi: kutilmagan format');
  return {
    times: {
      fajr: norm(t.tong_saharlik), sunrise: norm(t.quyosh), dhuhr: norm(t.peshin),
      asr: norm(t.asr), maghrib: norm(t.shom_iftor), isha: norm(t.hufton),
    },
    hijri: json.hijri_date ? `${json.hijri_date.day} ${json.hijri_date.month}` : undefined,
    source: 'islomapi',
    date,
  };
}

/** api.aladhan.com /v1/timings javobi */
export function parseAladhan(json: any, date: string): DayTimes {
  const t = json?.data?.timings;
  if (!t) throw new Error('aladhan: kutilmagan format');
  const h = json.data.date?.hijri;
  return {
    times: {
      fajr: norm(t.Fajr), sunrise: norm(t.Sunrise), dhuhr: norm(t.Dhuhr),
      asr: norm(t.Asr), maghrib: norm(t.Maghrib), isha: norm(t.Isha),
    },
    hijri: h ? `${h.day} ${h.month?.en} ${h.year}` : undefined,
    source: 'aladhan',
    date,
  };
}

export const islomapiUrl = (c: City) => `https://islomapi.uz/api/present/day?region=${encodeURIComponent(c.islomapi)}`;

export function aladhanUrl(c: City, d: Date) {
  const ds = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  // method=3 (MWL), school=1 (Hanafiy — Asr vaqti Oʻzbekistondagi kabi)
  return `https://api.aladhan.com/v1/timings/${ds}?latitude=${c.lat}&longitude=${c.lon}&method=3&school=1`;
}

export const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Hozirgi va keyingi namoz, keyingisigacha qolgan daqiqalar */
export function nextPrayer(times: Record<PrayerKey, string>, now: Date) {
  const cur = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const list = PRAYER_KEYS.map((k) => ({ key: k, min: toMinutes(times[k]) }));
  const next = list.find((p) => p.min > cur);
  const current = [...list].reverse().find((p) => p.min <= cur) ?? list[list.length - 1];
  if (next) return { current: current.key, next: next.key, minutesLeft: next.min - cur, tomorrow: false };
  return { current: 'isha' as PrayerKey, next: 'fajr' as PrayerKey, minutesLeft: 24 * 60 - cur + list[0].min, tomorrow: true };
}

export function formatCountdown(minutes: number) {
  const total = Math.max(0, Math.floor(minutes * 60));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const p = (x: number) => String(x).padStart(2, '0');
  return `${h ? h + ':' : ''}${p(m)}:${p(s)}`;
}

/** Oldingi namozdan keyingisigacha oʻtgan vaqt ulushi (0–1) */
export function prayerProgress(times: Record<PrayerKey, string>, now: Date): number {
  const cur = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const mins = PRAYER_KEYS.map((k) => toMinutes(times[k]));
  const nextIdx = mins.findIndex((m) => m > cur);
  let start: number, end: number;
  if (nextIdx === -1) { start = mins[mins.length - 1]; end = mins[0] + 24 * 60; }
  else if (nextIdx === 0) { start = mins[mins.length - 1] - 24 * 60; end = mins[0]; }
  else { start = mins[nextIdx - 1]; end = mins[nextIdx]; }
  return Math.max(0, Math.min(1, (cur - start) / (end - start)));
}
