import { useMemo, useState } from 'react';
import { useLocal } from '../hooks.ts';
import { useT } from '../i18n.ts';
import { Section, CopyButton, Segmented } from '../components/ui.tsx';
import { Icon } from '../components/Icon.tsx';
import { FRAME_RATES, getRate, tcToFrames, framesToTc, framesToSeconds, convertTc, humanDuration } from '../lib/timecode.ts';

function RateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {FRAME_RATES.map((r) => <option key={r.id} value={r.id}>{r.label} fps</option>)}
    </select>
  );
}

function TcInput({ value, onChange, valid, placeholder }: { value: string; onChange: (v: string) => void; valid: boolean; placeholder?: string }) {
  return (
    <input
      className={`input mono tc-input ${value && !valid ? 'is-invalid' : ''}`}
      value={value}
      placeholder={placeholder ?? '00:00:00:00'}
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
      <Section title={compact ? undefined : t('tc.title')} right={<RateSelect value={rateId} onChange={setRateId} />}>
        <div className="tc-calc">
          <TcInput value={a} onChange={setA} valid={fa !== null} />
          <div className="tc-op">
            <Segmented value={op} onChange={setOp} options={[{ value: '+', label: '+' }, { value: '-', label: '−' }]} />
          </div>
          <TcInput value={b} onChange={setB} valid={fb !== null} />
        </div>
        <div className="result-card">
          <div className="result-main mono">{result ? result.tc : '—'}</div>
          {result && (
            <div className="result-meta">
              <span>{result.frames.toLocaleString('ru-RU')} {t('tc.frames')}</span>
              <span>·</span>
              <span>{humanDuration(result.seconds)}</span>
              <CopyButton value={result.tc} />
            </div>
          )}
          {result && (
            <button className="link-btn" onClick={() => setA(result.tc)}>
              <Icon name="arrowUp" size={13} /> A = natija
            </button>
          )}
        </div>
        {!compact && <p className="hint">{t('tc.hint')}</p>}
      </Section>

      {!compact && (
        <>
          <Section title={t('tc.framesToTc')}>
            <div className="row">
              <input className="input mono" value={frames} onChange={(e) => setFrames(e.target.value)} inputMode="numeric" />
              <Icon name="swap" className="muted" />
              <div className="output mono">
                {framesTc ?? '—'}
                {framesTc && <CopyButton value={framesTc} />}
              </div>
            </div>
            {framesTc && <p className="hint">{t('tc.duration')}: {humanDuration(framesToSeconds(Math.round(framesNum), rate))}</p>}
          </Section>

          <Section title={t('tc.convert')}>
            <div className="row">
              <TcInput value={convIn} onChange={setConvIn} valid={tcToFrames(convIn, rate) !== null} />
              <span className="muted small">{rate.label} →</span>
              <RateSelect value={toRate} onChange={setToRate} />
            </div>
            <div className="output mono big">
              {converted ?? '—'}
              {converted && <CopyButton value={converted} />}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
