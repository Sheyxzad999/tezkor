export interface RGB { r: number; g: number; b: number }

const clamp = (x: number, lo = 0, hi = 255) => Math.min(hi, Math.max(lo, x));

/** "#abc", "abc", "#aabbcc", "rgb(1,2,3)" → RGB yoki null */
export function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();
  let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  m = s.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/);
  if (m) {
    const [r, g, b] = m.slice(1, 4).map(Number);
    if ([r, g, b].every((v) => v <= 255)) return { r, g, b };
  }
  return null;
}

export const toHex = ({ r, g, b }: RGB) =>
  '#' + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('').toUpperCase();

export function toHsl({ r, g, b }: RGB) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** WCAG nisbiy yorqinlik */
export function luminance({ r, g, b }: RGB) {
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** WCAG kontrast nisbati (1–21) */
export function contrast(a: RGB, b: RGB) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Rang ustida oʻqiladigan matn rangi */
export const readableOn = (c: RGB) => (luminance(c) > 0.4 ? '#000000' : '#FFFFFF');

/** Barcha formatlar — nusxa olish uchun */
export function formats(c: RGB) {
  const { h, s, l } = toHsl(c);
  const f = (v: number) => (v / 255).toFixed(3);
  return [
    { id: 'hex', label: 'HEX', value: toHex(c) },
    { id: 'rgb', label: 'RGB', value: `rgb(${c.r}, ${c.g}, ${c.b})` },
    { id: 'hsl', label: 'HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
    { id: 'float', label: 'Float (DaVinci / AE)', value: `${f(c.r)}, ${f(c.g)}, ${f(c.b)}` },
    { id: 'swift', label: 'SwiftUI', value: `Color(red: ${f(c.r)}, green: ${f(c.g)}, blue: ${f(c.b)})` },
    { id: 'flutter', label: 'Flutter', value: `Color(0xFF${toHex(c).slice(1)})` },
  ];
}
