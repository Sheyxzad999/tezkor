import { Suspense, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Icon } from './components/Icon.tsx';
import { Toasts } from './components/ui.tsx';
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

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22c3e6" />
          <stop offset="1" stopColor="#3ddc6f" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lg)" />
      <path d="M18 6L10 18h6l-2 8 8-12h-6z" fill="#fff" />
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
        <div className="brand" data-tauri-drag-region>
          <Logo />
          <b data-tauri-drag-region>Tezkor</b>
          <span className="muted small" data-tauri-drag-region>{current ? t(current.title) : t('set.title')}</span>
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
          {isTauri && (
            <button className="icon-btn" title={`${t('action.hide')} (${shortcut(keys.alt, 'Space')})`} onClick={() => getCurrentWindow().hide()}>
              <Icon name="minus" size={16} />
            </button>
          )}
        </div>
      </header>

      <nav className="rail">
        {WIDGETS.map((w) => (
          <button key={w.id} className={`rail-btn ${tab === w.id ? 'is-active' : ''}`} onClick={() => setTab(w.id)} title={t(w.title)}>
            <Icon name={w.icon} size={20} />
            <span>{t(w.title)}</span>
          </button>
        ))}
        <div className="rail-spacer" />
        <button className={`rail-btn ${tab === 'settings' ? 'is-active' : ''}`} onClick={() => setTab('settings')} title={t('nav.settings')}>
          <Icon name="settings" size={20} />
        </button>
      </nav>

      <main className="content" key={tab}>
        <Suspense fallback={null}>{Comp ? <Comp /> : <Settings />}</Suspense>
      </main>
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
