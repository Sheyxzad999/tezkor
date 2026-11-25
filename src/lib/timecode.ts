export interface FrameRate {
  id: string;
  label: string;
  /** Haqiqiy fps (masalan 29.97 = 30000/1001) */
  fps: number;
  /** Timecode'dagi kadrlar soni (masalan 29.97 uchun 30) */
  nominal: number;
  dropFrame: boolean;
}

export const FRAME_RATES: FrameRate[] = [
  { id: '23.976', label: '23.976', fps: 24000 / 1001, nominal: 24, dropFrame: false },
  { id: '24', label: '24', fps: 24, nominal: 24, dropFrame: false },
  { id: '25', label: '25 (PAL)', fps: 25, nominal: 25, dropFrame: false },
  { id: '29.97df', label: '29.97 DF', fps: 30000 / 1001, nominal: 30, dropFrame: true },
  { id: '29.97', label: '29.97 NDF', fps: 30000 / 1001, nominal: 30, dropFrame: false },
  { id: '30', label: '30', fps: 30, nominal: 30, dropFrame: false },
  { id: '50', label: '50', fps: 50, nominal: 50, dropFrame: false },
  { id: '59.94df', label: '59.94 DF', fps: 60000 / 1001, nominal: 60, dropFrame: true },
  { id: '60', label: '60', fps: 60, nominal: 60, dropFrame: false },
];

export const getRate = (id: string): FrameRate => FRAME_RATES.find((r) => r.id === id) ?? FRAME_RATES[1];

const dropCount = (r: FrameRate) => (r.dropFrame ? Math.round(r.nominal / 15) : 0); // 30→2, 60→4

/** "01:02:03:04" yoki "1:2:3;4" yoki "010203004" → kadrlar soni. Notoʻgʻri boʻlsa null. */
export function tcToFrames(input: string, rate: FrameRate): number | null {
  const s = input.trim();
  const neg = s.startsWith('-');
  const body = neg ? s.slice(1) : s;
  let parts: number[];
  if (/^\d{1,8}$/.test(body)) {
    // faqat raqamlar: oʻngdan 2 tadan ajratiladi (NLE'lardagi kabi)
    const padded = body.padStart(8, '0');
    parts = [0, 2, 4, 6].map((i) => Number(padded.slice(i, i + 2)));
  } else {
    const m = body.match(/^(\d{1,2})[:;.](\d{1,2})[:;.](\d{1,2})[:;.](\d{1,3})$/);
    if (!m) return null;
    parts = m.slice(1).map(Number);
  }
  const [h, mi, se, f] = parts;
  if (mi > 59 || se > 59 || f >= rate.nominal) return null;
  const totalMinutes = h * 60 + mi;
  const drop = dropCount(rate);
  const frames =
    (h * 3600 + mi * 60 + se) * rate.nominal + f - drop * (totalMinutes - Math.floor(totalMinutes / 10));
  return neg ? -frames : frames;
}

/** Kadrlar soni → "HH:MM:SS:FF" (drop-frame uchun oxirgi ajratuvchi ";") */
export function framesToTc(frames: number, rate: FrameRate): string {
  const neg = frames < 0;
  let n = Math.abs(Math.round(frames));
  const drop = dropCount(rate);
  if (drop) {
    const per10 = rate.nominal * 600 - drop * 9;
    const perMin = rate.nominal * 60 - drop;
    const d = Math.floor(n / per10);
    const m = n % per10;
    n += drop * 9 * d + (m > drop ? drop * Math.floor((m - drop) / perMin) : 0);
  }
  const ff = n % rate.nominal;
  const ss = Math.floor(n / rate.nominal) % 60;
  const mm = Math.floor(n / (rate.nominal * 60)) % 60;
  const hh = Math.floor(n / (rate.nominal * 3600));
  const p = (x: number) => String(x).padStart(2, '0');
  return `${neg ? '-' : ''}${p(hh)}:${p(mm)}:${p(ss)}${drop ? ';' : ':'}${p(ff)}`;
}

/** Kadrlar → haqiqiy vaqt (sekundlarda) */
export const framesToSeconds = (frames: number, rate: FrameRate) => frames / rate.fps;

/** Sekund → kadrlar (eng yaqin butun kadr) */
export const secondsToFrames = (seconds: number, rate: FrameRate) => Math.round(seconds * rate.fps);

/** Timecode'ni bir fps'dan boshqasiga haqiqiy vaqtni saqlab oʻgiradi */
export function convertTc(input: string, from: FrameRate, to: FrameRate): string | null {
  const f = tcToFrames(input, from);
  if (f === null) return null;
  return framesToTc(secondsToFrames(framesToSeconds(f, from), to), to);
}

/** Sekundlarni "1 soat 2 daq 3.5 s" koʻrinishida */
export function humanDuration(seconds: number): string {
  const s = Math.abs(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} soat`);
  if (m) parts.push(`${m} daq`);
  parts.push(`${Number(sec.toFixed(2))} s`);
  return (seconds < 0 ? '-' : '') + parts.join(' ');
}
