import { Suspense, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Icon } from './components/Icon.tsx';
import { PageHead, Toasts } from './components/ui.tsx';
import { useLocal } from './hooks.ts';
import { useT } from './i18n.ts';
import { isTauri, keys, shortcut } from './env.ts';
import { WIDGETS, getWidget, type WidgetDef } from './widgets/registry.ts';
import { useClipboardWatcher, useColorHotkey, usePrayerNotifier } from './background.ts';
import Settings from './widgets/Settings.tsx';

async function openFloating(w: WidgetDef, title: string) {
  if (!isTauri) return;
  const label = `widget-${w.id}`;
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    await existing.show();
    await existing.setFocus();
    return;
  }
  new WebviewWindow(label, {
    url: `index.html?widget=${w.id}`,
    title: `Tezkor · ${title}`,
    width: w.size[0],
    height: w.size[1],
    minWidth: 240,
    minHeight: 160,
    decorations: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    shadow: true,
  });
}

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6a17b" />
          <stop offset="1" stopColor="#e86a35" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#logo-g)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#fff" strokeOpacity=".3" />
      <path d="M18.2 5.5L9.5 18h6.3l-2 8.5L22.5 14h-6.3z" fill="#fff" />
    </svg>
  );
}

function MainPanel() {
  const { t } = useT();
  const [tab, setTab] = useLocal('tab', 'timecode');
  const [pinned, setPinned] = useState(false);
  useClipboardWatcher();
  useColorHotkey();
  usePrayerNotifier();

  const current = getWidget(tab);
  const Comp = current?.component;

  return (
    <div className="shell">
      <header className="topbar" data-tauri-drag-region>
        <div className="brand">
          <Logo />
          <b>Tezkor</b>
        </div>
        <div className="top-actions">
          {current && isTauri && (
            <button className="icon-btn" title={t('action.detach')} onClick={() => openFloating(current, t(current.title))}>
              <Icon name="detach" size={16} />
            </button>
          )}
          {isTauri && (
            <button
              className={`icon-btn ${pinned ? 'is-active' : ''}`}
              title={t('action.pin')}
              onClick={async () => { await getCurrentWindow().setAlwaysOnTop(!pinned); setPinned(!pinned); }}
            >
              <Icon name="pin" size={16} />
            </button>
          )}
          <button className={`icon-btn ${tab === 'settings' ? 'is-active' : ''}`} title={t('nav.settings')} onClick={() => setTab(tab === 'settings' ? 'timecode' : 'settings')}>
            <Icon name="settings" size={16} />
          </button>
          {isTauri && (
            <button className="icon-btn" title={`${t('action.hide')} (${shortcut(keys.alt, 'Space')})`} onClick={() => getCurrentWindow().hide()}>
              <Icon name="minus" size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="content" key={tab}>
        {current ? (
          <PageHead eyebrow={t(current.head.eyebrow)} title={t(current.head.title)} desc={current.head.desc && t(current.head.desc)} />
        ) : (
          <PageHead eyebrow={t('page.settings.eyebrow')} title={t('set.title')} />
        )}
        <div className="page-body">
          <Suspense fallback={null}>{Comp ? <Comp /> : <Settings />}</Suspense>
        </div>
      </main>

      <nav className="dock" aria-label="Vidjetlar">
        {WIDGETS.map((w) => (
          <button key={w.id} className={`dock-btn ${tab === w.id ? 'is-active' : ''}`} onClick={() => setTab(w.id)} title={t(w.title)}>
            <Icon name={w.icon} size={19} />
            <span>{t(w.title)}</span>
          </button>
        ))}
      </nav>
      <Toasts />
    </div>
  );
}

function FloatingWidget({ id }: { id: string }) {
  const { t } = useT();
  const w = getWidget(id);
  if (!w) return null;
  const Comp = w.component;
  return (
    <div className="floating">
      <header className="float-bar" data-tauri-drag-region>
        <Icon name={w.icon} size={14} />
        <span data-tauri-drag-region>{t(w.title)}</span>
        <button className="icon-btn ghost" onClick={() => getCurrentWindow().close()} title="Yopish">
          <Icon name="close" size={13} />
        </button>
      </header>
      <div className="float-body">
        <Suspense fallback={null}><Comp compact /></Suspense>
      </div>
      <Toasts />
    </div>
  );
}

export default function App() {
  const widget = new URLSearchParams(location.search).get('widget');
  return widget ? <FloatingWidget id={widget} /> : <MainPanel />;
}
