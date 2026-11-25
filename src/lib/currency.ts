export interface Rate {
  code: string;
  name: { uz: string; ru: string; en: string };
  /** 1 birlik uchun soʻm */
  rate: number;
  diff: number;
  date: string;
}

export const CBU_URL = 'https://cbu.uz/uz/arkhiv-kursov-valyut/json/';

export const FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺', KZT: '🇰🇿', CNY: '🇨🇳', TRY: '🇹🇷', GBP: '🇬🇧', KRW: '🇰🇷',
  JPY: '🇯🇵', AED: '🇦🇪', KGS: '🇰🇬', TJS: '🇹🇯', CHF: '🇨🇭', SAR: '🇸🇦', INR: '🇮🇳', UAH: '🇺🇦',
};

/** CBU JSON javobini tahlil qiladi */
export function parseCbu(json: unknown): Rate[] {
  if (!Array.isArray(json)) throw new Error('CBU: kutilmagan format');
  return json
    .map((r: any) => {
      const nominal = Number(r.Nominal) || 1;
      return {
        code: String(r.Ccy),
        name: { uz: String(r.CcyNm_UZ ?? r.Ccy), ru: String(r.CcyNm_RU ?? r.Ccy), en: String(r.CcyNm_EN ?? r.Ccy) },
        rate: Number(r.Rate) / nominal,
        diff: Number(r.Diff) / nominal,
        date: String(r.Date),
      };
    })
    .filter((r) => r.code && Number.isFinite(r.rate) && r.rate > 0);
}

/** amount `from` valyutada → `to` valyutada. "UZS" — soʻm. */
export function convert(amount: number, from: string, to: string, rates: Rate[]): number | null {
  const get = (c: string) => (c === 'UZS' ? 1 : rates.find((r) => r.code === c)?.rate);
  const a = get(from), b = get(to);
  if (a === undefined || b === undefined) return null;
  return (amount * a) / b;
}
