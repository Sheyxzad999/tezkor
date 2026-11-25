import { useState } from 'react';
import { useLocal } from '../hooks.ts';
import { useT } from '../i18n.ts';
import { Section, CopyButton } from '../components/ui.tsx';
import { Icon } from '../components/Icon.tsx';
import { invoke, isTauri, isMac, keys, shortcut, toast } from '../env.ts';
import { parseColor, toHex, formats, contrast, readableOn } from '../lib/color.ts';

const HISTORY_MAX = 18;

export function pushColor(hex: string, setCurrent: (v: string) => void, setHistory: (fn: (p: string[]) => string[]) => void) {
  setCurrent(hex);
  setHistory((h) => [hex, ...h.filter((x) => x !== hex)].slice(0, HISTORY_MAX));
}

declare global {
  interface Window { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }
}

export default function ColorPicker({ compact }: { compact?: boolean }) {
  const { t } = useT();
  const [current, setCurrent] = useLocal('color.current', '#0099B5');
  const [history, setHistory] = useLocal<string[]>('color.history', []);
  const [input, setInput] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const rgb = parseColor(current) ?? { r: 0, g: 153, b: 181 };
  const hex = toHex(rgb);

  const select = (v: string) => pushColor(v, setCurrent, setHistory);

  async function pickFromScreen() {
    // Windows (WebView2) — tizimning oʻz pipetkasi, lupa bilan
    if (window.EyeDropper) {
      try {
        const r = await new window.EyeDropper().open();
        const c = parseColor(r.sRGBHex);
        if (c) select(toHex(c));
      } catch { /* bekor qilindi */ }
      return;
    }
    // macOS — 3 soniya sanab, kursor ostidagi rangni olamiz
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);
    try {
      select(await invoke<string>('pick_color'));
    } catch (e) {
      toast(t('common.error'), String(e));
    }
  }

  const contrastWhite = contrast(rgb, { r: 255, g: 255, b: 255 });
  const contrastBlack = contrast(rgb, { r: 0, g: 0, b: 0 });

  return (
    <div className="widget color">
      <Section title={compact ? undefined : t('color.title')}>
        <div className="swatch" style={{ background: hex, color: readableOn(rgb) }}>
          <span className="mono">{countdown ? countdown : hex}</span>
          <label className="swatch-native" title="Palitra">
            <input type="color" value={hex.toLowerCase()} onChange={(e) => select(e.target.value.toUpperCase())} />
            <Icon name="color" size={16} />
          </label>
        </div>

        <div className="row">
          <button className="btn primary grow" onClick={pickFromScreen} disabled={!isTauri && !window.EyeDropper || countdown !== null}>
            <Icon name="eyedropper" size={16} />
            {countdown ? t('color.picking') : t('color.pick')}
          </button>
          <CopyButton value={hex} />
        </div>
        <p className="hint">
          {t('color.hotkey')}: <kbd>{shortcut(keys.alt, keys.shift, 'C')}</kbd>
          {isMac && <><br />{t('color.permission')}</>}
        </p>
      </Section>

      {!compact && (
        <>
          <Section title="Formatlar">
            <div className="kv-list">
              {formats(rgb).map((f) => (
                <div key={f.id} className="kv">
                  <span className="kv-k">{f.label}</span>
                  <span className="kv-v mono">{f.value}</span>
                  <CopyButton value={f.value} />
                </div>
              ))}
            </div>
            <div className="row">
              <input
                className="input mono"
                placeholder="#22C3E6 yoki rgb(34,195,230)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  const c = parseColor(input);
                  if (e.key === 'Enter' && c) { select(toHex(c)); setInput(''); }
                }}
              />
            </div>
          </Section>

          <Section title={t('color.contrast')}>
            <div className="contrast-row">
              {[{ bg: '#FFFFFF', v: contrastWhite }, { bg: '#000000', v: contrastBlack }].map((c) => (
                <div key={c.bg} className="contrast-chip" style={{ background: c.bg, color: hex }}>
                  <b>Aa</b>
                  <span style={{ color: c.bg === '#FFFFFF' ? '#111' : '#eee' }}>
                    {c.v.toFixed(2)} · {c.v >= 7 ? 'AAA' : c.v >= 4.5 ? 'AA' : c.v >= 3 ? 'AA Large' : '✕'}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {history.length > 0 && (
        <Section title={t('color.history')} right={<button className="icon-btn" title={t('action.clear')} onClick={() => setHistory([])}><Icon name="trash" size={15} /></button>}>
          <div className="swatches">
            {history.slice(0, compact ? 9 : HISTORY_MAX).map((c) => (
              <button key={c} className={`mini-swatch ${c === hex ? 'is-active' : ''}`} style={{ background: c }} title={c} onClick={() => setCurrent(c)} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
