// Checks the Learn Thai lesson data (learn-th.json): every item complete, Thai script clean,
// romanization readable and tone accents matching the tone each item claims.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const DATA = JSON.parse(readFileSync(new URL('../learn-th.json', import.meta.url), 'utf8'));

// Every object with a "thai" field, with a readable path for error messages
function items(node = DATA, path = 'learn-th') {
  const out = [];
  if (Array.isArray(node)) node.forEach((x, i) => out.push(...items(x, `${path}[${i}]`)));
  else if (node && typeof node === 'object') {
    if ('thai' in node) out.push({ item: node, path });
    for (const [k, v] of Object.entries(node)) if (v && typeof v === 'object') out.push(...items(v, `${path}.${k}`));
  }
  return out;
}
const ALL = items();
const THAI = /^[ก-๛ ]+$/;               // Thai letters, vowels, tone marks and spaces only
const ROMAN = /^[a-zɔɛəʉ̀́̂̌ ,.?'’()-]+$/i;
const TONE_MARK = { mid: null, low: '̀', falling: '̂', high: '́', rising: '̌' };
const tonesIn = (roman) => [...roman.normalize('NFD')].filter((c) => /[̀́̂̌]/.test(c));

test('the lessons have content', () => {
  assert.ok(ALL.length > 25, `only ${ALL.length} items`);
});

test('every item has Thai script, romanization and an English meaning', () => {
  for (const { item, path } of ALL) {
    for (const k of ['thai', 'roman', 'mean']) {
      assert.equal(typeof item[k], 'string', `${path}.${k} missing`);
      assert.ok(item[k].trim(), `${path}.${k} is empty`);
      assert.equal(item[k], item[k].trim(), `${path}.${k} has extra spaces`);
    }
  }
});

test('every example sentence is complete', () => {
  for (const { item, path } of ALL) {
    if (!('example' in item)) continue;
    const ex = item.example;
    assert.ok(ex && ex.thai && ex.roman && ex.mean, `${path}.example needs thai, roman and mean`);
  }
});

test('Thai text is Thai script only, written in standard Unicode order', () => {
  for (const { item, path } of ALL) {
    for (const k of ['thai', 'say']) {
      if (item[k] === undefined) continue;
      assert.match(item[k], THAI, `${path}.${k}: ${item[k]}`);
      assert.ok(!/  /.test(item[k]), `${path}.${k} has a double space`);
      // A tone mark typed before an upper or lower vowel looks right in some fonts but is wrong
      assert.ok(!/[่-๋][ัิ-ฺ็]/.test(item[k]), `${path}.${k}: tone mark typed before the vowel`);
      assert.ok(!/([่-๋])[่-๋]/.test(item[k]), `${path}.${k}: two tone marks on one letter`);
    }
  }
});

test('romanization uses only the letters explained in the key', () => {
  for (const { item, path } of ALL) assert.match(item.roman.normalize('NFD'), ROMAN, `${path}.roman: ${item.roman}`);
});

test('tone accents match the tone each item claims', () => {
  for (const { item, path } of ALL) {
    if (!item.tone) continue;
    assert.ok(item.tone in TONE_MARK, `${path}: unknown tone ${item.tone}`);
    const marks = tonesIn(item.roman), want = TONE_MARK[item.tone];
    if (want) assert.deepEqual(marks, [want], `${path}: ${item.roman} should carry the ${item.tone} accent`);
    else assert.deepEqual(marks, [], `${path}: ${item.roman} is mid tone, so no accent`);
  }
  for (const t of DATA.tones.list) {
    const want = TONE_MARK[t.id], marks = tonesIn(t.word.roman);
    assert.deepEqual(marks, want ? [want] : [], `tone ${t.id}: example ${t.word.roman}`);
  }
});

test('five tones, four tone marks, each tone set covers all five tones', () => {
  assert.deepEqual(DATA.tones.list.map((t) => t.id), ['mid', 'low', 'falling', 'high', 'rising']);
  assert.equal(DATA.tones.marks.list.length, 4);
  for (const s of DATA.tones.sets) assert.deepEqual(s.items.map((i) => i.tone), ['mid', 'low', 'falling', 'high', 'rising'], s.title);
});

test('every Thai word can be spoken in Thai', () => {
  assert.equal(DATA.lang, 'th-TH');
});

test('no stray Thai vowel or tone mark floating on a non-Thai character', () => {
  const walk = (node, path) => {
    if (typeof node === 'string') {
      if (path.endsWith('.mark') || /\.columns\[\d+\]$/.test(path)) return; // a lone mark shown on purpose (drawn on อ)
      assert.doesNotMatch(node, /(^|[^\u0E01-\u0E4E])[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/, `${path}: ${node}`);
    } else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, Array.isArray(node) ? `${path}[${k}]` : `${path}.${k}`);
  };
  walk(DATA, 'learn-th');
});
