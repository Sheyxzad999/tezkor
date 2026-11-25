import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jsonFormat, jsonMinify, base64Encode, base64Decode, urlDecode, jwtDecode, parseTimestamp, sha256, uuid } from './devtools.ts';

test('JSON', () => {
  assert.deepEqual(jsonFormat('{"a":1}'), { ok: true, value: '{\n  "a": 1\n}' });
  assert.deepEqual(jsonMinify('{ "a" : [1, 2] }'), { ok: true, value: '{"a":[1,2]}' });
  assert.equal(jsonFormat('{bad').ok, false);
});

test('Base64 UTF-8', () => {
  const r = base64Encode('Oʻzbekiston 🇺🇿');
  assert.ok(r.ok);
  assert.deepEqual(base64Decode(r.ok ? r.value : ''), { ok: true, value: 'Oʻzbekiston 🇺🇿' });
  assert.deepEqual(base64Decode('c2Fsb20'), { ok: true, value: 'salom' }, 'paddingsiz');
  assert.equal(base64Decode('!!!').ok, false);
});

test('URL', () => {
  assert.deepEqual(urlDecode('a%20b+c'), { ok: true, value: 'a b c' });
  assert.equal(urlDecode('%E0%A4%A').ok, false);
});

test('JWT', () => {
  const t = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE3MDAwMDAwMDB9.sig';
  const r = jwtDecode(t, 1_800_000_000_000);
  assert.ok(r.ok);
  if (r.ok) {
    assert.deepEqual(r.value.header, { alg: 'HS256' });
    assert.equal(r.value.payload.sub, '123');
    assert.equal(r.value.expired, true);
  }
  assert.equal(jwtDecode('abc').ok, false);
});

test('timestamp', () => {
  assert.equal(parseTimestamp('1700000000')?.toISOString(), '2023-11-14T22:13:20.000Z');
  assert.equal(parseTimestamp('1700000000000')?.toISOString(), '2023-11-14T22:13:20.000Z');
  assert.equal(parseTimestamp('nima'), null);
});

test('sha256 va uuid', async () => {
  assert.equal(await sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.match(uuid(), /^[0-9a-f-]{36}$/);
});
