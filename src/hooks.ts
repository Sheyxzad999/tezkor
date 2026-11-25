import { useCallback, useEffect, useRef, useState } from 'react';

const PREFIX = 'tezkor:';
const SYNC = 'tezkor-storage';

function read<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? initial : (JSON.parse(raw) as T);
  } catch {
    return initial;
  }
}

export function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(SYNC, { detail: key }));
}

export const readLocal = read;

/**
 * localStorage bilan sinxron state. Boshqa oynalar (vidjetlar) va
 * shu oynadagi boshqa komponentlar bilan avtomatik sinxronlanadi.
 */
export function useLocal<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const initialRef = useRef(initial);
  const [value, setValue] = useState<T>(() => read(key, initial));

  useEffect(() => {
    const reload = () => setValue(read(key, initialRef.current));
    const onStorage = (e: StorageEvent) => { if (e.key === PREFIX + key) reload(); };
    const onSync = (e: Event) => { if ((e as CustomEvent).detail === key) reload(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener(SYNC, onSync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SYNC, onSync);
    };
  }, [key]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const prev = read(key, initialRef.current);
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      writeLocal(key, next);
      setValue(next);
    },
    [key],
  );

  return [value, set];
}

export function useInterval(fn: () => void, ms: number | null) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (ms === null) return;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

/** Har `ms` da yangilanadigan hozirgi vaqt */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useInterval(() => setNow(new Date()), ms);
  return now;
}
