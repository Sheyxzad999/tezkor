import { lazy, type ComponentType } from 'react';
import type { Key } from '../i18n.ts';

export interface WidgetDef {
  id: string;
  icon: string;
  title: Key;
  /** Alohida vidjet oynasining oʻlchami */
  size: [number, number];
  component: ComponentType<{ compact?: boolean }>;
}

export const WIDGETS: WidgetDef[] = [
  { id: 'timecode', icon: 'timecode', title: 'nav.timecode', size: [320, 280], component: lazy(() => import('./Timecode.tsx')) },
  { id: 'color', icon: 'color', title: 'nav.color', size: [300, 360], component: lazy(() => import('./ColorPicker.tsx')) },
  { id: 'monitor', icon: 'monitor', title: 'nav.monitor', size: [280, 250], component: lazy(() => import('./Monitor.tsx')) },
  { id: 'currency', icon: 'currency', title: 'nav.currency', size: [300, 380], component: lazy(() => import('./Currency.tsx')) },
  { id: 'prayer', icon: 'prayer', title: 'nav.prayer', size: [280, 400], component: lazy(() => import('./Prayer.tsx')) },
  { id: 'clipboard', icon: 'clipboard', title: 'nav.clipboard', size: [320, 420], component: lazy(() => import('./Clipboard.tsx')) },
  { id: 'dev', icon: 'dev', title: 'nav.dev', size: [380, 460], component: lazy(() => import('./DevTools.tsx')) },
];

export const getWidget = (id: string) => WIDGETS.find((w) => w.id === id);
