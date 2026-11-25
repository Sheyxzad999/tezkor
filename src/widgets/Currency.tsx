import { useEffect, useState } from 'react';
import { formatSum, sumToWords } from 'uzkit';
import { useLocal } from '../hooks.ts';
import { useT } from '../i18n.ts';
import { Section, Empty, CopyButton } from '../components/ui.tsx';
import { Icon } from '../components/Icon.tsx';
import { CBU_URL, FLAGS, parseCbu, convert, type Rate } from '../lib/currency.ts';

interface Cache { rates: Rate[]; fetchedAt: number }

const fmt = (n: number, d = 2) => formatSum(Number(n.toFixed(d)), { currency: false, decimals: d });

export default function Currency({ compact }: { compact?: boolean }) {
  const { t, lang } = useT();
  const [cache, setCache] = useLocal<Cache | null>('currency.cache', null);
  const [pinned, setPinned] = useLocal<string[]>('currency.pinned', ['USD', 'EUR', 'RUB', 'KZT', 'CNY', 'TRY']);
  const [amount, setAmount] = useLocal('currency.amount', '100');
  const [code, setCode] = useLocal('currency.code', 'USD');
  const [toUzs, setToUzs] = useLocal('currency.toUzs', true);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(CBU_URL);
      const rates = parseCbu(await res.json());
      setCache({ rates, fetchedAt: Date.now() });
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!cache || Date.now() - cache.fetchedAt > 60 * 60 * 1000) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!cache) return <Empty>{loading ? t('common.loading') : <button className="btn" onClick={load}>{t('common.retry')}</button>}</Empty>;

  const rates = cache.rates;
  const name = (r: Rate) => (lang === 'ru' ? r.name.ru : lang === 'en' ? r.name.en : r.name.uz);
  const shown = pinned.map((c) => rates.find((r) => r.code === c)).filter((r): r is Rate => !!r);
  const num = Number(String(amount).replace(/\s/g, '').replace(',', '.'));
  const result = Number.isFinite(num) ? (toUzs ? convert(num, code, 'UZS', rates) : convert(num, 'UZS', code, rates)) : null;

  return (
    <div className="widget currency">
      <Section
        title={compact ? undefined : t('cur.title')}
        right={
          <span className="muted small row-tight">
            {rates[0]?.date}
            <button className="icon-btn" title={t('action.refresh')} onClick={load} disabled={loading}>
              <Icon name="refresh" size={14} className={loading ? 'spin' : ''} />
            </button>
          </span>
        }
      >
        {offline && <p className="hint warn">{t('common.offline')}</p>}
        <div className="rates">
          {shown.slice(0, compact ? 4 : undefined).map((r) => (
            <div key={r.code} className="rate" onClick={() => setCode(r.code)}>
              <span className="flag">{FLAGS[r.code] ?? '💱'}</span>
              <div className="rate-name">
                <b>{r.code}</b>
                {!compact && <span className="muted small">{name(r)}</span>}
              </div>
              <div className="rate-val">
                <b className="mono">{fmt(r.rate)}</b>
                <span className={`small mono ${r.diff > 0 ? 'up' : r.diff < 0 ? 'down' : 'muted'}`}>
                  {r.diff > 0 ? '▲' : r.diff < 0 ? '▼' : '•'} {fmt(Math.abs(r.diff))}
                </span>
              </div>
              {!compact && (
                <button className="icon-btn ghost" title="Olib tashlash" onClick={(e) => { e.stopPropagation(); setPinned(pinned.filter((p) => p !== r.code)); }}>
                  <Icon name="close" size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
        {!compact && (
          <select className="select" value="" onChange={(e) => e.target.value && setPinned([...pinned, e.target.value])}>
            <option value="">+ {t('cur.add')}</option>
            {rates.filter((r) => !pinned.includes(r.code)).map((r) => (
              <option key={r.code} value={r.code}>{r.code} — {name(r)}</option>
            ))}
          </select>
        )}
      </Section>

      <Section title={compact ? undefined : t('cur.converter')}>
        <div className="converter">
          <input className="input mono" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          <div className="conv-codes">
            <span>{toUzs ? <select className="select inline" value={code} onChange={(e) => setCode(e.target.value)}>{rates.map((r) => <option key={r.code}>{r.code}</option>)}</select> : 'UZS'}</span>
            <button className="icon-btn" onClick={() => setToUzs(!toUzs)} title="Almashtirish"><Icon name="swap" size={15} /></button>
            <span>{toUzs ? 'UZS' : <select className="select inline" value={code} onChange={(e) => setCode(e.target.value)}>{rates.map((r) => <option key={r.code}>{r.code}</option>)}</select>}</span>
          </div>
        </div>
        <div className="result-card">
          <div className="result-main mono">{result === null ? '—' : fmt(result)} <small>{toUzs ? 'soʻm' : code}</small></div>
          {result !== null && (
            <div className="result-meta">
              {toUzs && !compact && result < 1e15 && <span className="words">{sumToWords(Math.round(result), { script: lang === 'uz-cyrl' ? 'cyrl' : 'latn' })}</span>}
              <CopyButton value={result.toFixed(2)} />
            </div>
          )}
        </div>
        {!compact && <p className="hint">{t('cur.source')} · cbu.uz</p>}
      </Section>
    </div>
  );
}
