import { useState } from 'react';
import { useLocal } from '../hooks.ts';
import { useT } from '../i18n.ts';
import { Section, CopyButton } from '../components/ui.tsx';
import { Icon } from '../components/Icon.tsx';
import { invoke, isTauri, isMac, keys, shortcut, toast, copyText } from '../env.ts';
import { parseColor, toHex, toHsl, formats, contrast, readableOn } from '../lib/color.ts';

const HISTORY_MAX = 18;

declare global {
  interface Window { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }
}

export default function ColorPicker({ compact }: { compact?: boolean }) {
  const { t } = useT();
  const [current, setCurrent] = useLocal('color.current', '#F0875A');
  const [history, setHistory] = useLocal<string[]>('color.history', ['#F0875A', '#18181B', '#F6F5F1', '#6FCF8E', '#7CB7FF', '#C5A3FF', '#F3B65B']);
  const [input, setInput] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const rgb = parseColor(current) ?? { r: 240, g: 135, b: 90 };
  const hex = toHex(rgb);
  const { h, s, l } = toHsl(rgb);

  const select = (v: string) => {
    setCurrent(v);
    setHistory((p) => [v, ...p.filter((x) => x !== v)].slice(0, HISTORY_MAX));
  };

  async function pickFromScreen() {
    if (window.EyeDropper) {
      try {
        const r = await new window.EyeDropper().open();
        const c = parseColor(r.sRGBHex);
        if (c) select(toHex(c));
      } catch { /* bekor qilindi */ }
      return;
    }
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

  const cW = contrast(rgb, { r: 255, g: 255, b: 255 });
  const cB = contrast(rgb, { r: 0, g: 0, b: 0 });
  const grade = (v: number) => (v >= 7 ? 'AAA' : v >= 4.5 ? 'AA' : v >= 3 ? 'AA+' : '—');

  return (
    <div className="widget color">
      <div className="swatch" style={{ background: hex, color: readableOn(rgb), ['--swatch' as string]: hex }}>
        <div className="swatch-tools">
          <label className="swatch-tool" title="Palitra">
            <input type="color" value={hex.toLowerCase()} onChange={(e) => select(e.target.value.toUpperCase())} />
            <Icon name="color" size={16} />
          </label>
          <button className="swatch-tool" title={t('action.copy')} onClick={() => copyText(hex)}><Icon name="copy" size={15} /></button>
        </div>
        <div className="swatch-hex">{hex}</div>
        <div className="swatch-sub">rgb {rgb.r} {rgb.g} {rgb.b} · hsl {h}° {s}% {l}%</div>
        {countdown && <div className="countdown-badge">{countdown}</div>}
      </div>

      <button className="btn primary" onClick={pickFromScreen} disabled={(!isTauri && !window.EyeDropper) || countdown !== null}>
        <Icon name="eyedropper" size={16} />
        {countdown ? t('color.picking') : t('color.pick')}
      </button>
      {!compact && (
        <p className="hint" style={{ textAlign: 'center' }}>
          {t('color.hotkey')}: <kbd>{shortcut(keys.alt, keys.shift, 'C')}</kbd>
        </p>
      )}

      {history.length > 0 && (
        <Section title={t('color.history')} right={!compact && <button className="icon-btn ghost" title={t('action.clear')} onClick={() => setHistory([])}><Icon name="trash" size={14} /></button>}>
          <div className="swatches">
            {history.slice(0, compact ? 9 : HISTORY_MAX).map((c) => (
              <button key={c} className={`mini-swatch ${c === hex ? 'is-active' : ''}`} style={{ background: c }} title={c} onClick={() => setCurrent(c)} />
            ))}
          </div>
        </Section>
      )}

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
            <input
              className="input mono"
              placeholder="#F0875A · rgb(240 135 90)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                const c = parseColor(input);
                if (e.key === 'Enter' && c) { select(toHex(c)); setInput(''); }
              }}
            />
          </Section>

          <Section title={t('color.contrast')}>
            <div className="contrast-row">
              <div className="contrast-chip" style={{ background: '#FFFFFF', color: hex }}>
                <b>Aa</b><span style={{ color: '#18181b' }}>{cW.toFixed(1)} · {grade(cW)}</span>
              </div>
              <div className="contrast-chip" style={{ background: '#131315', color: hex }}>
                <b>Aa</b><span style={{ color: '#ededea' }}>{cB.toFixed(1)} · {grade(cB)}</span>
              </div>
            </div>
          </Section>
          {isMac && <p className="hint" style={{ padding: '0 4px' }}>{t('color.permission')}</p>}
        </>
      )}
    </div>
  );
}
