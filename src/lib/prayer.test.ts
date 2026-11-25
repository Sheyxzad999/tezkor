import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIslomapi, parseAladhan, nextPrayer, formatCountdown, aladhanUrl, CITIES } from './prayer.ts';

const T = { fajr: '05:45', sunrise: '07:23', dhuhr: '12:10', asr: '15:17', maghrib: '16:57', isha: '18:29' };

test('parseIslomapi', () => {
  const r = parseIslomapi({
    region: 'Toshkent', hijri_date: { month: 'jumadul oxir', day: 15 },
    times: { tong_saharlik: '5:45', quyosh: '07:23', peshin: '12:10', asr: '15:17', shom_iftor: '16:57', hufton: '18:29' },
  }, '2026-11-25');
  assert.deepEqual(r.times, T);
  assert.equal(r.source, 'islomapi');
  assert.throws(() => parseIslomapi({}, ''));
});

test('parseAladhan', () => {
  const r = parseAladhan({ data: { timings: { Fajr: '05:45 (+05)', Sunrise: '07:23', Dhuhr: '12:10', Asr: '15:17', Maghrib: '16:57', Isha: '18:29' } } }, 'x');
  assert.deepEqual(r.times, T);
});

test('nextPrayer', () => {
  const at = (h: number, m: number) => new Date(2026, 10, 25, h, m, 0);
  assert.deepEqual(nextPrayer(T, at(12, 0)), { current: 'sunrise', next: 'dhuhr', minutesLeft: 10, tomorrow: false });
  assert.equal(nextPrayer(T, at(4, 0)).next, 'fajr');
  const late = nextPrayer(T, at(23, 0));
  assert.equal(late.next, 'fajr');
  assert.equal(late.tomorrow, true);
  assert.equal(late.minutesLeft, 60 + 5 * 60 + 45);
});

test('formatCountdown', () => {
  assert.equal(formatCountdown(10), '10:00');
  assert.equal(formatCountdown(125.5), '2:05:30');
});

test('aladhanUrl', () => {
  assert.match(aladhanUrl(CITIES[0], new Date(2026, 10, 5)), /timings\/05-11-2026\?latitude=41\.2995&longitude=69\.2401&method=3&school=1$/);
});

import { prayerProgress } from './prayer.ts';
test('prayerProgress', () => {
  const at = (h: number, m: number) => new Date(2026, 10, 25, h, m, 0);
  assert.equal(prayerProgress(T, at(12, 10)), 0, 'peshin boshlandi');
  assert.ok(Math.abs(prayerProgress(T, at(13, 43.5)) - 0.5) < 0.01, 'peshin–asr oʻrtasi');
  const night = prayerProgress(T, at(23, 59));
  assert.ok(night > 0.4 && night < 0.6, 'xufton–bomdod oraligʻi');
  assert.ok(prayerProgress(T, at(3, 0)) > 0.7, 'tun oxiri');
});
