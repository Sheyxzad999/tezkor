import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCbu, convert } from './currency.ts';

const SAMPLE = [
  { Ccy: 'USD', CcyNm_UZ: 'AQSH dollari', CcyNm_RU: 'Доллар США', CcyNm_EN: 'US Dollar', Nominal: '1', Rate: '12000.00', Diff: '-12.39', Date: '25.11.2026' },
  { Ccy: 'JPY', CcyNm_UZ: 'Yaponiya iyenasi', Nominal: '10', Rate: '800.00', Diff: '1', Date: '25.11.2026' },
  { Ccy: 'BAD', Rate: 'x' },
];

test('parseCbu', () => {
  const r = parseCbu(SAMPLE);
  assert.equal(r.length, 2);
  assert.equal(r[0].rate, 12000);
  assert.equal(r[1].rate, 80, 'nominal hisobga olinadi');
  assert.throws(() => parseCbu({}));
});

test('convert', () => {
  const r = parseCbu(SAMPLE);
  assert.equal(convert(100, 'USD', 'UZS', r), 1_200_000);
  assert.equal(convert(1_200_000, 'UZS', 'USD', r), 100);
  assert.equal(convert(1, 'USD', 'JPY', r), 150);
  assert.equal(convert(1, 'XXX', 'UZS', r), null);
});
