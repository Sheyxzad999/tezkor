export interface ClipItem { id: string; text: string; at: number; pinned?: boolean }
export type ClipKind = 'url' | 'email' | 'color' | 'json' | 'number' | 'phone' | 'code' | 'text';

export function detectKind(text: string): ClipKind {
  const s = text.trim();
  if (/^https?:\/\/\S+$/i.test(s)) return 'url';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'email';
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s) || /^rgba?\(/i.test(s)) return 'color';
  if (/^\+?998[\s\d-]{9,}$/.test(s.replace(/[()]/g, ''))) return 'phone';
  if (/^-?[\d\s.,]+$/.test(s) && /\d/.test(s)) return 'number';
  if (/^[[{]/.test(s)) {
    try { JSON.parse(s); return 'json'; } catch { /* oddiy matn */ }
  }
  if (/[;{}]\s*$|^(import|export|const|let|function|def|class|SELECT|<\w+)/m.test(s)) return 'code';
  return 'text';
}

export const MAX_ITEMS = 100;
export const MAX_LENGTH = 20_000;

/** Yangi matnni tarixga qoʻshadi: takrorini tepaga chiqaradi, qadalganlarni saqlaydi */
export function addClip(list: ClipItem[], text: string, now = Date.now()): ClipItem[] {
  if (!text.trim() || text.length > MAX_LENGTH) return list;
  const existing = list.find((i) => i.text === text);
  if (existing && list[0] === existing) return list;
  const rest = list.filter((i) => i.text !== text);
  const item: ClipItem = { id: existing?.id ?? `${now}-${Math.random().toString(36).slice(2, 8)}`, text, at: now, pinned: existing?.pinned };
  const next = [item, ...rest];
  const pinned = next.filter((i) => i.pinned);
  const normal = next.filter((i) => !i.pinned).slice(0, Math.max(0, MAX_ITEMS - pinned.length));
  return next.filter((i) => i.pinned || normal.includes(i));
}

export function timeAgo(at: number, now = Date.now()) {
  const s = Math.floor((now - at) / 1000);
  if (s < 60) return 'hozir';
  if (s < 3600) return `${Math.floor(s / 60)} daq`;
  if (s < 86400) return `${Math.floor(s / 3600)} soat`;
  return `${Math.floor(s / 86400)} kun`;
}
