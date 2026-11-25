import { lazy, type ComponentType } from 'react';
import type { Key } from '../i18n.ts';

export interface WidgetDef {
  id: string;
  icon: string;
  title: Key;
  /** Sahifa sarlavhasi: kichik yozuv, katta nom, izoh */
  head: { eyebrow: Key; title: Key; desc?: Key };
  /** Alohida vidjet oynasining oʻlchami */
  size: [number, number];
  component: ComponentType<{ compact?: boolean }>;
}

export const WIDGETS: WidgetDef[] = [
  { id: 'timecode', head: { eyebrow: 'page.timecode.eyebrow', title: 'tc.title', desc: 'page.timecode.desc' }, icon: 'timecode', title: 'nav.timecode', size: [320, 280], component: lazy(() => import('./Timecode.tsx')) },
  { id: 'color', head: { eyebrow: 'page.color.eyebrow', title: 'color.title', desc: 'page.color.desc' }, icon: 'color', title: 'nav.color', size: [300, 360], component: lazy(() => import('./ColorPicker.tsx')) },
  { id: 'monitor', head: { eyebrow: 'page.monitor.eyebrow', title: 'page.monitor.title' }, icon: 'monitor', title: 'nav.monitor', size: [280, 250], component: lazy(() => import('./Monitor.tsx')) },
  { id: 'currency', head: { eyebrow: 'page.currency.eyebrow', title: 'page.currency.title', desc: 'cur.source' }, icon: 'currency', title: 'nav.currency', size: [300, 380], component: lazy(() => import('./Currency.tsx')) },
  { id: 'prayer', head: { eyebrow: 'page.prayer.eyebrow', title: 'pr.title' }, icon: 'prayer', title: 'nav.prayer', size: [280, 400], component: lazy(() => import('./Prayer.tsx')) },
  { id: 'clipboard', head: { eyebrow: 'page.clipboard.eyebrow', title: 'page.clipboard.title', desc: 'clip.local' }, icon: 'clipboard', title: 'nav.clipboard', size: [320, 420], component: lazy(() => import('./Clipboard.tsx')) },
  { id: 'dev', head: { eyebrow: 'page.dev.eyebrow', title: 'page.dev.title' }, icon: 'dev', title: 'nav.dev', size: [380, 460], component: lazy(() => import('./DevTools.tsx')) },
];

export const getWidget = (id: string) => WIDGETS.find((w) => w.id === id);
