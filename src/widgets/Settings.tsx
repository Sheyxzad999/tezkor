import { useEffect, useState } from 'react';
import { useLocal } from '../hooks.ts';
import { useT, type Lang } from '../i18n.ts';
import { Section, Toggle } from '../components/ui.tsx';
import { isTauri, keys, shortcut } from '../env.ts';

export default function Settings() {
  const { t } = useT();
  const [lang, setLang] = useLocal<Lang>('lang', 'uz');
  const [autostart, setAutostart] = useState(false);

  useEffect(() => {
    if (!isTauri) return;
    import('@tauri-apps/plugin-autostart').then(({ isEnabled }) => isEnabled().then(setAutostart)).catch(() => {});
  }, []);

  async function toggleAutostart(v: boolean) {
    const m = await import('@tauri-apps/plugin-autostart');
    await (v ? m.enable() : m.disable());
    setAutostart(await m.isEnabled());
  }

  return (
    <div className="widget settings">
      <Section title={t('set.lang')}>
        <div className="lang-grid">
          {([['uz', 'Oʻzbekcha'], ['uz-cyrl', 'Ўзбекча'], ['ru', 'Русский'], ['en', 'English']] as [Lang, string][]).map(([v, l]) => (
            <button key={v} className={`btn ${lang === v ? 'primary' : ''}`} onClick={() => setLang(v)}>{l}</button>
          ))}
        </div>
      </Section>

      {isTauri && (
        <Section>
          <Toggle checked={autostart} onChange={toggleAutostart} label={t('set.autostart')} />
        </Section>
      )}

      <Section title={t('set.shortcuts')}>
        <div className="kv-list">
          <div className="kv"><span className="kv-k">{t('set.toggle')}</span><kbd>{shortcut(keys.alt, 'Space')}</kbd></div>
          <div className="kv"><span className="kv-k">{t('set.pickColor')}</span><kbd>{shortcut(keys.alt, keys.shift, 'C')}</kbd></div>
        </div>
      </Section>

      <Section title={t('set.about')}>
        <p className="about">
          <b>Tezkor</b> v0.2.0 — open-source, MIT.<br />
          github.com/Sheyxzad999/tezkor<br />
          © 2026 Shaxzod · sheyxzad.uz
        </p>
        <button
          className="btn danger"
          onClick={() => {
            if (confirm(t('set.reset') + '?')) {
              Object.keys(localStorage).filter((k) => k.startsWith('tezkor:')).forEach((k) => localStorage.removeItem(k));
              location.reload();
            }
          }}
        >
          {t('set.reset')}
        </button>
      </Section>
    </div>
  );
}
