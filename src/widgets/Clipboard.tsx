import { useMemo, useState } from 'react';
import { useLocal, useNow } from '../hooks.ts';
import { useT } from '../i18n.ts';
import { Section, Empty } from '../components/ui.tsx';
import { Icon } from '../components/Icon.tsx';
import { copyText, isTauri } from '../env.ts';
import { demoClips } from '../demo.ts';
import { detectKind, timeAgo, type ClipItem } from '../lib/clipboard.ts';

const KIND_LABEL: Record<string, string> = {
  url: 'URL', email: 'Email', color: 'Rang', json: 'JSON', number: 'Son', phone: 'Tel', code: 'Kod', text: 'Matn',
};

export default function Clipboard({ compact }: { compact?: boolean }) {
  const { t } = useT();
  const [items, setItems] = useLocal<ClipItem[]>('clip.items', isTauri ? [] : demoClips());
  const [paused, setPaused] = useLocal('clip.paused', false);
  const [q, setQ] = useState('');
  const now = useNow(30_000).getTime();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? items.filter((i) => i.text.toLowerCase().includes(s)) : items;
    return [...list.filter((i) => i.pinned), ...list.filter((i) => !i.pinned)];
  }, [items, q]);

  const togglePin = (id: string) => setItems(items.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i)));
  const remove = (id: string) => setItems(items.filter((i) => i.id !== id));

  return (
    <div className="widget clipboard">
      <Section
        plain
        title={`${items.length} / 100`}
        right={
          <span className="row-tight">
            <button className={`icon-btn ${paused ? 'is-warn' : ''}`} title={paused ? t('clip.resume') : t('clip.pause')} onClick={() => setPaused(!paused)}>
              <Icon name={paused ? 'play' : 'pause'} size={14} />
            </button>
            <button className="icon-btn" title={t('action.clear')} onClick={() => setItems(items.filter((i) => i.pinned))}>
              <Icon name="trash" size={14} />
            </button>
          </span>
        }
      >
        {!compact && (
          <div className="search">
            <Icon name="search" size={15} />
            <input className="input" placeholder={t('clip.search')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        )}
        {paused && <p className="hint warn">{t('clip.paused')}</p>}
        {filtered.length === 0 ? (
          <Empty>{t('clip.empty')}</Empty>
        ) : (
          <div className="clips">
            {filtered.slice(0, compact ? 8 : 100).map((i) => {
              const kind = detectKind(i.text);
              return (
                <div key={i.id} className={`clip ${i.pinned ? 'is-pinned' : ''}`} onClick={() => copyText(i.text)} title={i.text.slice(0, 500)}>
                  <div className="clip-body">
                    {kind === 'color' && <i className="clip-color" style={{ background: i.text.trim() }} />}
                    <span className={kind === 'code' || kind === 'json' ? 'mono' : ''}>{i.text.trim().slice(0, 160)}</span>
                  </div>
                  <div className="clip-meta">
                    <span className={`kind kind-${kind}`}>{KIND_LABEL[kind]}</span>
                    <span className="muted small">{timeAgo(i.at, now)}</span>
                    <span className="clip-actions">
                      <button className={`icon-btn ghost ${i.pinned ? 'is-active' : ''}`} onClick={(e) => { e.stopPropagation(); togglePin(i.id); }}>
                        <Icon name="pin" size={13} />
                      </button>
                      <button className="icon-btn ghost" onClick={(e) => { e.stopPropagation(); remove(i.id); }}>
                        <Icon name="close" size={13} />
                      </button>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
