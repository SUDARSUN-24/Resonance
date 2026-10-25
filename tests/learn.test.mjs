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
  assert.ok(ALL.length > 100, `only ${ALL.length} items`);
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

test('all 44 consonants, each once, in the right class', () => {
  const classes = Object.fromEntries(DATA.consonants.classes.map((c) => [c.id, c.letters.map((l) => l.letter)]));
  assert.equal(classes.mid.join(''), 'กจฎฏดตบปอ');
  assert.equal(classes.high.join(''), 'ขฃฉฐถผฝศษสห');
  assert.equal(classes.low.length, 24);
  const all = Object.values(classes).flat();
  assert.equal(all.length, 44);
  assert.equal(new Set(all).size, 44, 'a letter is listed twice');
  for (const c of DATA.consonants.classes) for (const l of c.letters) {
    assert.ok(l.thai.startsWith(l.letter + ' '), `${l.letter}: the name should start with the letter`);
    assert.ok(l.sound && l.final, `${l.letter}: needs sound and final`);
    // Letter names: high class rising, middle and low class mid (กอ, ขอ, คอ)
    const nameTone = tonesIn(l.roman.split(' ')[0]);
    assert.deepEqual(nameTone, c.id === 'high' ? ['̌'] : [], `${l.letter}: name tone in ${l.roman}`);
  }
});

test('the tone rule table has a row per class and a cell per column', () => {
  const r = DATA.consonants.rules;
  assert.deepEqual(r.rows.map((x) => x.class), ['mid', 'high', 'low']);
  for (const row of r.rows) assert.equal(row.tones.length, r.columns.length, row.class);
});

test('vowel pairs have a short and a long form, each with an example', () => {
  for (const p of DATA.vowels.pairs) {
    assert.ok(p.short && p.long, 'pair needs short and long');
    assert.ok(p.short.example && p.long.example, `${p.short.thai}/${p.long.thai} needs examples`);
  }
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

test('ไ and ใ are always romanized ai, never aai', () => {
  for (const { item, path } of ALL) {
    for (const [t, r] of [[item.thai, item.roman], [item.example?.thai, item.example?.roman]]) {
      if (!t || !/[ไใ]/.test(t)) continue;
      // aai is only right where the Thai really has the long vowel า + ย (ขาย, ควาย)
      if (/aai/.test(r.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) assert.match(t, /าย/, `${path}: ${t} → ${r}`);
    }
  }
});

test('about 40 verbs, each once, each used in its own example sentence', () => {
  const verbs = DATA.verbs.list;
  assert.ok(verbs.length >= 40, `only ${verbs.length} verbs`);
  assert.equal(new Set(verbs.map((v) => v.thai)).size, verbs.length, 'a verb is listed twice');
  assert.match(DATA.verbs.intro, new RegExp(`^${verbs.length} `), 'the intro gives the right number of verbs');
  for (const v of verbs) {
    assert.ok(v.example, `${v.thai} needs an example sentence`);
    assert.ok(v.example.thai.includes(v.thai), `${v.thai}: the example doesn’t use the verb`);
  }
});

test('tense and aspect words: จะ, กำลัง, แล้ว, ไม่ and ยัง, each shown in use', () => {
  const markers = Object.fromEntries(DATA.grammar.markers.map((m) => [m.thai, m]));
  for (const w of ['จะ', 'กำลัง', 'แล้ว', 'ไม่', 'ยัง']) {
    assert.ok(markers[w], `${w} is missing`);
    assert.ok(markers[w].where && markers[w].how, `${w} needs where and how`);
    assert.ok(markers[w].examples.length >= 2, `${w} needs at least two examples`);
  }
  for (const m of DATA.grammar.markers) for (const ex of m.examples) assert.ok(ex.thai.includes(m.thai), `${m.thai}: example ${ex.thai} doesn’t use it`);
  for (const d of DATA.grammar.demo.items) assert.ok(d.thai.includes('กิน'), `${d.thai}: the demo should keep the same verb`);
});

test('topic lists, with all three polite particles', () => {
  const lists = Object.fromEntries(DATA.topics.lists.map((l) => [l.id, l]));
  for (const id of ['greetings', 'numbers', 'food', 'travel', 'family', 'questions', 'particles']) {
    assert.ok(lists[id], `topic ${id} is missing`);
    assert.ok(lists[id].icon && lists[id].name && lists[id].note, `${id} needs icon, name and note`);
    assert.ok(lists[id].items.length >= 4, `${id} has too few words`);
    assert.equal(new Set(lists[id].items.map((i) => i.thai)).size, lists[id].items.length, `${id}: a word is listed twice`);
  }
  const particles = lists.particles.items.map((i) => i.thai);
  for (const p of ['ครับ', 'ค่ะ', 'คะ']) assert.ok(particles.includes(p), `${p} is missing`);
  const nums = lists.numbers.items.map((i) => i.n);
  assert.ok(nums.every((n) => Number.isInteger(n)), 'every number has its value');
  assert.deepEqual(nums, [...nums].sort((a, b) => a - b), 'numbers are in order');
});

test('Thai words in explanations can also be heard somewhere on the page', () => {
  const spoken = new Set(ALL.flatMap(({ item }) => [item.thai, item.example?.thai]).filter(Boolean));
  const walk = (node, path) => {
    if (node && typeof node === 'object') { for (const [k, v] of Object.entries(node)) walk(v, Array.isArray(node) ? `${path}[${k}]` : `${path}.${k}`); return; }
    if (typeof node !== 'string' || !/\.(intro|note|tip|how|where|why|title)$/.test(path)) return;
    for (const w of node.match(/[\u0E01-\u0E4E]{2,}/g) || []) assert.ok(spoken.has(w), `${path}: “${w}” has no Listen button anywhere`);
  };
  walk(DATA, 'learn-th');
});
