import { useEffect, useState } from 'react';
import { useLocal, useNow } from '../hooks.ts';
import { useT } from '../i18n.ts';
import { Section, Segmented, CopyButton } from '../components/ui.tsx';
import {
  jsonFormat, jsonMinify, base64Encode, base64Decode, urlEncode, urlDecode, jwtDecode,
  parseTimestamp, sha256, uuid, type Result,
} from '../lib/devtools.ts';

type Tool = 'json' | 'base64' | 'url' | 'jwt' | 'uuid' | 'time' | 'hash';

function Output({ r }: { r: Result | null }) {
  if (!r) return null;
  return r.ok ? (
    <div className="code-out">
      <pre className="mono">{r.value}</pre>
      <CopyButton value={r.value} />
    </div>
  ) : (
    <div className="code-out is-error mono">{r.error}</div>
  );
}

function TwoWay({ enc, dec, labels }: { enc: (s: string) => Result; dec: (s: string) => Result; labels: [string, string] }) {
  const [input, setInput] = useState('');
  const [out, setOut] = useState<Result | null>(null);
  return (
    <>
      <textarea className="textarea mono" rows={4} value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
      <div className="row">
        <button className="btn grow" onClick={() => setOut(enc(input))}>{labels[0]}</button>
        <button className="btn grow" onClick={() => setOut(dec(input))}>{labels[1]}</button>
      </div>
      <Output r={out} />
    </>
  );
}

function Jwt() {
  const { t } = useT();
  const [token, setToken] = useState('');
  const r = token.trim() ? jwtDecode(token) : null;
  return (
    <>
      <textarea className="textarea mono" rows={4} placeholder="eyJhbGciOi..." value={token} onChange={(e) => setToken(e.target.value)} spellCheck={false} />
      {r && !r.ok && <div className="code-out is-error">{r.error}</div>}
      {r && r.ok && (
        <>
          {r.value.expiresAt && (
            <p className={`hint ${r.value.expired ? 'warn' : 'ok'}`}>
              {r.value.expired ? t('dev.expired') : t('dev.valid')} · exp: {r.value.expiresAt.toLocaleString()}
            </p>
          )}
          <Output r={{ ok: true, value: JSON.stringify(r.value.header, null, 2) }} />
          <Output r={{ ok: true, value: JSON.stringify(r.value.payload, null, 2) }} />
        </>
      )}
    </>
  );
}

function Uuids() {
  const { t } = useT();
  const [list, setList] = useState<string[]>(() => [uuid()]);
  return (
    <>
      <div className="row">
        {[1, 5, 10].map((n) => (
          <button key={n} className="btn grow" onClick={() => setList(Array.from({ length: n }, uuid))}>{t('dev.generate')} ×{n}</button>
        ))}
      </div>
      <Output r={{ ok: true, value: list.join('\n') }} />
    </>
  );
}

function Time() {
  const { t } = useT();
  const now = useNow(1000);
  const [input, setInput] = useState('');
  const d = input.trim() ? parseTimestamp(input) : null;
  const unix = Math.floor(now.getTime() / 1000);
  return (
    <>
      <div className="kv-list">
        <div className="kv"><span className="kv-k">{t('dev.now')} (s)</span><span className="kv-v mono">{unix}</span><CopyButton value={String(unix)} /></div>
        <div className="kv"><span className="kv-k">{t('dev.now')} (ms)</span><span className="kv-v mono">{now.getTime()}</span><CopyButton value={String(now.getTime())} /></div>
      </div>
      <input className="input mono" placeholder="1700000000 yoki 2026-11-25T10:00" value={input} onChange={(e) => setInput(e.target.value)} />
      {input.trim() && (d ? (
        <div className="kv-list">
          {[
            ['Mahalliy', d.toLocaleString()],
            ['ISO 8601', d.toISOString()],
            ['Unix (s)', String(Math.floor(d.getTime() / 1000))],
            ['Unix (ms)', String(d.getTime())],
          ].map(([k, v]) => (
            <div key={k} className="kv"><span className="kv-k">{k}</span><span className="kv-v mono">{v}</span><CopyButton value={v} /></div>
          ))}
        </div>
      ) : <div className="code-out is-error">Sana notoʻgʻri</div>)}
    </>
  );
}

function Hash() {
  const [input, setInput] = useState('');
  const [out, setOut] = useState('');
  useEffect(() => { let alive = true; sha256(input).then((h) => alive && setOut(h)); return () => { alive = false; }; }, [input]);
  return (
    <>
      <textarea className="textarea mono" rows={3} value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
      <Output r={{ ok: true, value: out }} />
    </>
  );
}

function Json() {
  const { t } = useT();
  const [input, setInput] = useState('');
  const [out, setOut] = useState<Result | null>(null);
  return (
    <>
      <textarea className="textarea mono" rows={6} placeholder='{"salom": "dunyo"}' value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
      <div className="row">
        <button className="btn grow" onClick={() => setOut(jsonFormat(input))}>{t('dev.format')}</button>
        <button className="btn grow" onClick={() => setOut(jsonMinify(input))}>{t('dev.minify')}</button>
      </div>
      <Output r={out} />
    </>
  );
}

export default function DevTools({ compact }: { compact?: boolean }) {
  const { t } = useT();
  const [tool, setTool] = useLocal<Tool>('dev.tool', 'json');
  return (
    <div className="widget dev">
      <Section title={compact ? undefined : t('dev.title')}>
        <div className="chips">
          <Segmented<Tool>
            value={tool}
            onChange={setTool}
            options={[
              { value: 'json', label: 'JSON' }, { value: 'base64', label: 'Base64' }, { value: 'url', label: 'URL' },
              { value: 'jwt', label: 'JWT' }, { value: 'uuid', label: 'UUID' }, { value: 'time', label: 'Unix' },
              { value: 'hash', label: 'SHA-256' },
            ]}
          />
        </div>
        {tool === 'json' && <Json />}
        {tool === 'base64' && <TwoWay key="b64" enc={base64Encode} dec={base64Decode} labels={[t('dev.encode'), t('dev.decode')]} />}
        {tool === 'url' && <TwoWay key="url" enc={urlEncode} dec={urlDecode} labels={[t('dev.encode'), t('dev.decode')]} />}
        {tool === 'jwt' && <Jwt />}
        {tool === 'uuid' && <Uuids />}
        {tool === 'time' && <Time />}
        {tool === 'hash' && <Hash />}
      </Section>
    </div>
  );
}
