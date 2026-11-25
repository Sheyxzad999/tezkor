import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseColor, toHex, toHsl, contrast, readableOn, formats } from './color.ts';

test('parseColor', () => {
  assert.deepEqual(parseColor('#0099b5'), { r: 0, g: 153, b: 181 });
  assert.deepEqual(parseColor('fff'), { r: 255, g: 255, b: 255 });
  assert.deepEqual(parseColor('rgb(30, 181, 58)'), { r: 30, g: 181, b: 58 });
  assert.equal(parseColor('rgb(300,0,0)'), null);
  assert.equal(parseColor('salom'), null);
});

test('konvertatsiya', () => {
  assert.equal(toHex({ r: 0, g: 153, b: 181 }), '#0099B5');
  assert.deepEqual(toHsl({ r: 255, g: 0, b: 0 }), { h: 0, s: 100, l: 50 });
  assert.deepEqual(toHsl({ r: 128, g: 128, b: 128 }), { h: 0, s: 0, l: 50 });
});

test('kontrast', () => {
  assert.equal(Math.round(contrast({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })), 21);
  assert.equal(readableOn({ r: 255, g: 255, b: 0 }), '#000000');
  assert.equal(readableOn({ r: 0, g: 0, b: 128 }), '#FFFFFF');
});

test('formats', () => {
  const f = Object.fromEntries(formats({ r: 255, g: 0, b: 0 }).map((x) => [x.id, x.value]));
  assert.equal(f.float, '1.000, 0.000, 0.000');
  assert.equal(f.flutter, 'Color(0xFFFF0000)');
});
