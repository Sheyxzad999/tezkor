import { invoke as tauriInvoke } from '@tauri-apps/api/core';

/** Dastur Tauri ichida ishlayaptimi (brauzerda emas) */
export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || navigator.userAgent);

/** Tugma nomlari: Mac'da ⌥, Windows'da Alt */
export const keys = {
  alt: isMac ? '⌥' : 'Alt',
  shift: isMac ? '⇧' : 'Shift',
  join: isMac ? '' : '+',
};
export const shortcut = (...k: string[]) => k.join(keys.join);

export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri) throw new Error('Bu funksiya faqat Tezkor dasturida ishlaydi');
  return tauriInvoke<T>(cmd, args);
}

export async function copyText(text: string) {
  if (isTauri) {
    const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
    await writeText(text);
  } else {
    await navigator.clipboard.writeText(text);
  }
  toast('Nusxalandi', text.length > 40 ? text.slice(0, 40) + '…' : text);
}

export async function readClipboard(): Promise<string | null> {
  try {
    if (isTauri) {
      const { readText } = await import('@tauri-apps/plugin-clipboard-manager');
      return (await readText()) ?? null;
    }
    return null;
  } catch {
    return null; // clipboard'da matn yoʻq (rasm va h.k.)
  }
}

export function toast(title: string, body?: string) {
  window.dispatchEvent(new CustomEvent('tezkor-toast', { detail: { title, body } }));
}
