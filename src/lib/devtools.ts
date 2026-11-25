export type Result = { ok: true; value: string } | { ok: false; error: string };
const ok = (value: string): Result => ({ ok: true, value });
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : String(e) });

export function jsonFormat(input: string, indent = 2): Result {
  try { return ok(JSON.stringify(JSON.parse(input), null, indent)); } catch (e) { return fail(e); }
}
export function jsonMinify(input: string): Result {
  try { return ok(JSON.stringify(JSON.parse(input))); } catch (e) { return fail(e); }
}

const bytesToB64 = (bytes: Uint8Array) => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

/** UTF-8 xavfsiz Base64 */
export const base64Encode = (input: string): Result => ok(bytesToB64(new TextEncoder().encode(input)));

export function base64Decode(input: string): Result {
  try {
    const clean = input.trim().replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return ok(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return fail('Base64 notoʻgʻri');
  }
}

export const urlEncode = (s: string): Result => ok(encodeURIComponent(s));
export function urlDecode(s: string): Result {
  try { return ok(decodeURIComponent(s.replace(/\+/g, ' '))); } catch (e) { return fail(e); }
}

export interface JwtInfo { header: unknown; payload: Record<string, unknown>; expiresAt: Date | null; expired: boolean | null }

export function jwtDecode(token: string, now = Date.now()): { ok: true; value: JwtInfo } | { ok: false; error: string } {
  const parts = token.trim().split('.');
  if (parts.length < 2) return { ok: false, error: 'JWT 3 qismdan iborat boʻlishi kerak' };
  try {
    const dec = (p: string) => {
      const r = base64Decode(p);
      if (!r.ok) throw new Error(r.error);
      return JSON.parse(r.value);
    };
    const header = dec(parts[0]);
    const payload = dec(parts[1]);
    const exp = typeof payload.exp === 'number' ? new Date(payload.exp * 1000) : null;
    return { ok: true, value: { header, payload, expiresAt: exp, expired: exp ? exp.getTime() < now : null } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'JWT xato' };
  }
}

/** Unix vaqt (sekund yoki millisekund) yoki sana satri → Date */
export function parseTimestamp(input: string): Date | null {
  const s = input.trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    return new Date(Math.abs(n) < 1e11 ? n * 1000 : n);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const uuid = () => crypto.randomUUID();
