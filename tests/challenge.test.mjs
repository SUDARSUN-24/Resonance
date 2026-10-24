// Unit tests for challenge links (challenge.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { BLOCKED } from '../netlify/lib/leaderboard.mjs';

const SRC = readFileSync(new URL('../challenge.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(SRC, { window, TextEncoder, TextDecoder, btoa, atob });
const C = window.RSChallenge;

const GAME = {
  twisters: { easy: ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'], medium: ['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'], hard: ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'] },
  max: { easy: 1000, medium: 1250, hard: 1500 }
};
const plain = (o) => JSON.parse(JSON.stringify(o));
const make = (over = {}) => ({ d: 'medium', i: [3, 0, 5, 1, 7], s: [1250, 62, 1049, 1250, 1250], n: 'Ana', ...over });

test('a challenge survives the round trip through a link', () => {
  const code = C.encode(make(), GAME);
  assert.match(code, /^[A-Za-z0-9_-]+$/, 'safe to put in a URL without escaping');
  const url = C.link('https://resonancesun.netlify.app/play.html?x=1#old', code);
  assert.equal(url, 'https://resonancesun.netlify.app/play.html?x=1#challenge=' + code);
  assert.deepEqual(plain(C.decode(C.fromHash(new URL(url).hash), GAME)),
    { ok: true, d: 'medium', i: [3, 0, 5, 1, 7], s: [1250, 62, 1049, 1250, 1250], n: 'Ana', total: 4861 });
});

test('names in any script survive, and a bad name becomes anonymous', () => {
  for (const n of ['สมชาย', '山田 太郎', 'José-Luis', 'Ana_99']) assert.equal(C.decode(C.encode(make({ n }), GAME), GAME).n, n);
  assert.equal(C.encode(make({ n: 'x' }), GAME), null, 'too short to send');
  assert.equal(C.encode(make({ n: 'shit head' }), GAME), null, 'blocked words cannot be sent');
  assert.equal(C.encode(make({ n: '<b>hi</b>' }), GAME), null, 'markup is refused');
  // A hand-made link with a rude or odd name still opens, without the name
  const forged = (n) => Buffer.from(JSON.stringify({ v: 1, d: 'medium', i: [3, 0, 5, 1, 7], s: [1, 2, 3, 4, 5], n, h: C.checksum(['b3', 'b0', 'b5', 'b1', 'b7']) })).toString('base64url');
  assert.equal(C.decode(forged('f.u.c.k'), GAME).n, null);
  assert.equal(C.decode(forged('<img src=x>'), GAME).n, null);
  assert.equal(C.decode(forged('A'.repeat(40)), GAME).n, 'A'.repeat(16), 'long names are cut to 16');
  assert.equal(C.decode(forged('Bob'), GAME).ok, true);
});

test('broken or tampered links are refused', () => {
  const code = C.encode(make(), GAME);
  const edit = (fn) => { const o = JSON.parse(Buffer.from(code, 'base64url').toString()); fn(o); return Buffer.from(JSON.stringify(o)).toString('base64url'); };
  for (const bad of [null, '', 'not base64 !', 'x'.repeat(601), Buffer.from('nope').toString('base64url'), Buffer.from([0xff, 0xfe, 0xfd]).toString('base64url')]) {
    assert.deepEqual(plain(C.decode(bad, GAME)), { ok: false, why: 'broken' }, String(bad).slice(0, 20));
  }
  const cases = [
    (o) => { o.v = 2; }, (o) => { o.d = 'insane'; }, (o) => { o.d = 'constructor'; },
    (o) => { o.i = [1, 2, 3]; }, (o) => { o.i[1] = 3; }, (o) => { o.i[0] = -1; }, (o) => { o.i[0] = 1.5; },
    (o) => { o.s[0] = 1251; }, (o) => { o.s[0] = -5; }, (o) => { o.s[2] = '900'; }, (o) => { o.s.push(1); }
  ];
  for (const fn of cases) assert.equal(C.decode(edit(fn), GAME).why, 'broken', fn.toString());
});

test('a link made before the twister list changed says it is outdated', () => {
  const code = C.encode(make(), GAME);
  const changed = { ...GAME, twisters: { ...GAME.twisters, medium: ['b0', 'b1', 'b2', 'NEW', 'b4', 'b5', 'b6', 'b7'] } };
  assert.deepEqual(plain(C.decode(code, changed)), { ok: false, why: 'outdated' });
  const shorter = { ...GAME, twisters: { ...GAME.twisters, medium: ['b0', 'b1'] } };
  assert.equal(C.decode(code, shorter).why, 'outdated');
});

test('fromHash only reads challenge links', () => {
  assert.equal(C.fromHash('#challenge=abc'), 'abc');
  assert.equal(C.fromHash('#daily'), null);
  assert.equal(C.fromHash(''), null);
});

test('the browser blocks the same words as the leaderboard', () => {
  assert.equal(C.BLOCKED.source, BLOCKED.source);
  assert.equal(C.BLOCKED.flags, BLOCKED.flags);
});
