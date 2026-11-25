import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectKind, addClip, MAX_ITEMS, timeAgo } from './clipboard.ts';

test('detectKind', () => {
  assert.equal(detectKind('https://sheyxzad.uz'), 'url');
  assert.equal(detectKind('a@b.uz'), 'email');
  assert.equal(detectKind('#0099B5'), 'color');
  assert.equal(detectKind('+998 90 123 45 67'), 'phone');
  assert.equal(detectKind('1 250 000'), 'number');
  assert.equal(detectKind('{"a":1}'), 'json');
  assert.equal(detectKind('const x = 1;'), 'code');
  assert.equal(detectKind('salom dunyo'), 'text');
});

test('addClip: takror tepaga chiqadi', () => {
  let l = addClip([], 'a', 1);
  l = addClip(l, 'b', 2);
  l = addClip(l, 'a', 3);
  assert.deepEqual(l.map((i) => i.text), ['a', 'b']);
  assert.equal(addClip(l, '   ', 4), l, 'boʻsh matn qoʻshilmaydi');
  assert.equal(addClip(l, 'a', 5), l, 'oxirgisi bilan bir xil — oʻzgarmaydi');
});

test('addClip: limit va qadalganlar', () => {
  let l = addClip([], 'pin', 0);
  l = [{ ...l[0], pinned: true }];
  for (let i = 0; i < MAX_ITEMS + 20; i++) l = addClip(l, `t${i}`, i + 1);
  assert.equal(l.length, MAX_ITEMS);
  assert.ok(l.some((i) => i.text === 'pin' && i.pinned), 'qadalgan oʻchmaydi');
  assert.equal(l[0].text, `t${MAX_ITEMS + 19}`);
});

test('timeAgo', () => {
  assert.equal(timeAgo(0, 30_000), 'hozir');
  assert.equal(timeAgo(0, 5 * 60_000), '5 daq');
  assert.equal(timeAgo(0, 2 * 86400_000), '2 kun');
});
