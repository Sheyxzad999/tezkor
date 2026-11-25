import { useMemo, useState } from 'react';
import { useLocal } from '../hooks.ts';
import { useT } from '../i18n.ts';
import { Section, CopyButton } from '../components/ui.tsx';
import { Icon } from '../components/Icon.tsx';
import { FRAME_RATES, getRate, tcToFrames, framesToTc, framesToSeconds, convertTc, humanDuration } from '../lib/timecode.ts';

function RateChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="chips">
      {FRAME_RATES.map((r) => (
        <button key={r.id} className={`chip ${r.id === value ? 'is-active' : ''}`} onClick={() => onChange(r.id)}>
          {r.label.replace(' (PAL)', '')}
        </button>
      ))}
    </div>
  );
}

function RateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {FRAME_RATES.map((r) => <option key={r.id} value={r.id}>{r.label.replace(' (PAL)', '')}</option>)}
    </select>
  );
}

function TcInput({ value, onChange, valid }: { value: string; onChange: (v: string) => void; valid: boolean }) {
  return (
    <input
      className={`input tc-input ${value && !valid ? 'is-invalid' : ''}`}
      value={value}
      placeholder="00:00:00:00"
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function Timecode({ compact }: { compact?: boolean }) {
  const { t } = useT();
  const [rateId, setRateId] = useLocal('tc.rate', '25');
  const [a, setA] = useLocal('tc.a', '00:01:30:00');
  const [b, setB] = useLocal('tc.b', '00:00:12:10');
  const [op, setOp] = useLocal<'+' | '-'>('tc.op', '+');
  const [frames, setFrames] = useState('1500');
  const [convIn, setConvIn] = useState('00:00:10:00');
  const [toRate, setToRate] = useLocal('tc.toRate', '24');
  const rate = getRate(rateId);

  const fa = tcToFrames(a, rate), fb = tcToFrames(b, rate);
  const result = useMemo(() => {
    if (fa === null || fb === null) return null;
    const f = op === '+' ? fa + fb : fa - fb;
    return { tc: framesToTc(f, rate), frames: f, seconds: framesToSeconds(f, rate) };
  }, [fa, fb, op, rate]);

  const framesNum = Number(frames.replace(/\s/g, ''));
  const framesTc = Number.isFinite(framesNum) && frames.trim() !== '' ? framesToTc(Math.round(framesNum), rate) : null;
  const converted = convertTc(convIn, rate, getRate(toRate));

  return (
    <div className="widget timecode">
      {compact ? (
        <div className="row"><span className="mini-label grow">{t('tc.fps')}</span><RateSelect value={rateId} onChange={setRateId} /></div>
      ) : (
        <RateChips value={rateId} onChange={setRateId} />
      )}

      <div className="tc-stack">
        <TcInput value={a} onChange={setA} valid={fa !== null} />
        <div className="tc-op">
          {(['+', '-'] as const).map((o) => (
            <button key={o} className={op === o ? 'is-active' : ''} onClick={() => setOp(o)}>{o === '+' ? '+' : '−'}</button>
          ))}
        </div>
        <TcInput value={b} onChange={setB} valid={fb !== null} />
      </div>

      <div className="hero">
        <div className="hero-label">{t('tc.result')} · {rate.label.replace(' (PAL)', '')} fps</div>
        <div className="hero-value mono">{result ? result.tc : '—'}</div>
        {result && (
          <div className="hero-meta">
            <span>{result.frames.toLocaleString('ru-RU')} {t('tc.frames')}</span>
            <span>·</span>
            <span>{humanDuration(result.seconds)}</span>
          </div>
        )}
        {result && (
          <div className="hero-actions">
            <button className="icon-btn" title="A = natija" onClick={() => setA(result.tc)}><Icon name="arrowUp" size={15} /></button>
            <CopyButton value={result.tc} />
          </div>
        )}
      </div>

      {!compact && (
        <>
          <p className="hint" style={{ padding: '0 4px' }}>{t('tc.hint')}</p>
          <Section title={t('tc.framesToTc')}>
            <input className="input mono" value={frames} onChange={(e) => setFrames(e.target.value)} inputMode="numeric" />
            <div className="output mono">
              <span>{framesTc ?? '—'}</span>
              {framesTc && <CopyButton value={framesTc} />}
            </div>
            {framesTc && <p className="hint">{t('tc.duration')}: {humanDuration(framesToSeconds(Math.round(framesNum), rate))}</p>}
          </Section>

          <Section title={t('tc.convert')} right={<span className="row-tight muted small">{rate.label.replace(' (PAL)', '')} → <RateSelect value={toRate} onChange={setToRate} /></span>}>
            <TcInput value={convIn} onChange={setConvIn} valid={tcToFrames(convIn, rate) !== null} />
            <div className="output mono big">
              <span>{converted ?? '—'}</span>
              {converted && <CopyButton value={converted} />}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
