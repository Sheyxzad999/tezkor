import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tcToFrames, framesToTc, getRate, convertTc, humanDuration } from './timecode.ts';

const r24 = getRate('24'), r25 = getRate('25'), df = getRate('29.97df'), df60 = getRate('59.94df');

test('NDF: TC ↔ kadr', () => {
  assert.equal(tcToFrames('00:00:01:00', r24), 24);
  assert.equal(tcToFrames('01:00:00:00', r25), 90000);
  assert.equal(framesToTc(24 * 3661 + 5, r24), '01:01:01:05');
  assert.equal(tcToFrames('1000', r25), 250, 'faqat raqam: 00:00:10:00');
  assert.equal(tcToFrames('-00:00:01:00', r24), -24);
  assert.equal(framesToTc(-24, r24), '-00:00:01:00');
});

test('notoʻgʻri TC', () => {
  assert.equal(tcToFrames('00:00:00:24', r24), null);
  assert.equal(tcToFrames('00:61:00:00', r24), null);
  assert.equal(tcToFrames('salom', r24), null);
});

test('29.97 drop-frame', () => {
  assert.equal(framesToTc(1799, df), '00:00:59;29');
  assert.equal(framesToTc(1800, df), '00:01:00;02');
  assert.equal(framesToTc(17982, df), '00:10:00;00');
  assert.equal(framesToTc(107892, df), '01:00:00;00');
  assert.equal(tcToFrames('00:01:00;02', df), 1800);
  assert.equal(tcToFrames('00:10:00;00', df), 17982);
  assert.equal(tcToFrames('01:00:00;00', df), 107892);
  for (const n of [0, 1, 1799, 1800, 1801, 3598, 17981, 17982, 123456, 999999]) {
    assert.equal(tcToFrames(framesToTc(n, df), df), n, `round-trip ${n}`);
  }
});

test('59.94 drop-frame', () => {
  assert.equal(framesToTc(3600, df60), '00:01:00;04');
  assert.equal(tcToFrames('01:00:00;00', df60), 215784);
});

test('fps oʻgirish', () => {
  assert.equal(convertTc('00:00:10:00', r25, r24), '00:00:10:00');
  assert.equal(convertTc('00:00:01:12', r24, r25), '00:00:01:13');
  assert.equal(convertTc('xx', r24, r25), null);
});

test('humanDuration', () => {
  assert.equal(humanDuration(3723.5), '1 soat 2 daq 3.5 s');
  assert.equal(humanDuration(5), '5 s');
});
