// Checks the language practice phrase lists (phrases.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../phrases.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(SRC, { window });
const LANGS = window.RSPhrases;
const TH = LANGS.find((l) => l.code === 'th');

test('every language has the fields the practice screen needs', () => {
  assert.ok(LANGS.length >= 1);
  const codes = new Set();
  for (const l of LANGS) {
    assert.match(l.code, /^[a-z]{2,3}$/);
    assert.ok(!codes.has(l.code), `duplicate language ${l.code}`); codes.add(l.code);
    assert.match(l.lang, /^[a-z]{2,3}-[A-Z]{2}$/);
    for (const k of ['flag', 'name', 'native']) assert.ok(l[k], `${l.code}.${k}`);
    assert.ok(l.topics.length >= 1);
    const ids = new Set(), texts = new Set();
    for (const t of l.topics) {
      assert.match(t.id, /^[a-z-]+$/);
      assert.ok(!ids.has(t.id), `duplicate topic ${t.id}`); ids.add(t.id);
      assert.ok(t.icon && t.name && t.native, `${t.id} needs icon, name and native name`);
      assert.ok(t.phrases.length >= 4, `${t.id} has too few phrases`);
      for (const p of t.phrases) {
        assert.ok(p.text && p.roman && p.mean, `${t.id}: every phrase needs text, roman and mean`);
        assert.ok(!texts.has(p.text), `duplicate phrase ${p.text}`); texts.add(p.text);
        assert.match(p.roman, /^[a-z ,'’-]+$/i, `romanisation should be plain letters: ${p.roman}`);
        if (p.alt) assert.ok(Array.isArray(p.alt));
      }
    }
  }
});

test('Thai phrases are Thai script only, with no repeat mark the recogniser writes differently', () => {
  for (const t of TH.topics) for (const p of t.phrases) {
    assert.match(p.text, /^[฀-๿ ]+$/, p.text);
    assert.ok(!p.text.includes('ๆ'), `${p.text}: avoid ๆ`);
  }
  assert.equal(TH.topics.reduce((n, t) => n + t.phrases.length, 0), 64);
});

test('Thai questions are flagged so women get คะ, not ค่ะ', () => {
  for (const t of TH.topics) for (const p of t.phrases) {
    if (/(ไหม|อะไร|ที่ไหน|ไหน|เท่าไหร่|กี่)ครับ$/.test(p.text)) assert.equal(p.q, true, `${p.text} should be q:true`);
  }
});

test('Thai polite endings: each choice shows the right ending and accepts the other', () => {
  const all = TH.topics.flatMap((t) => t.phrases);
  for (const p of all) {
    const m = TH.polite.form(p, 'khrap'), f = TH.polite.form(p, 'kha');
    assert.equal(m.text, p.text);
    assert.equal(m.gender, 'male'); assert.equal(f.gender, 'female');
    assert.ok(!f.text.includes('ครับ'), `${f.text} still says ครับ`);
    assert.ok(!/\bkhrap\b/.test(f.roman), f.roman);
    if (p.text.includes('ครับ')) {
      assert.ok(m.alt.includes(f.text), `${p.text}: the khrap form should accept ${f.text}`);
      assert.ok(f.alt.includes(p.text), `${p.text}: the kha form should accept ครับ`);
      assert.ok(m.alt.includes(p.text.replace(/\s*ครับ/g, '')), `${p.text}: should accept no ending`);
    }
    assert.ok(!m.alt.includes(m.text) && new Set(m.alt).size === m.alt.length, 'alternatives are unique and differ from the text');
  }
  const q = TH.polite.form(all.find((p) => p.text === 'สบายดีไหมครับ'), 'kha');
  assert.equal(q.text, 'สบายดีไหมคะ');
  assert.equal(TH.polite.form(all.find((p) => p.text === 'สวัสดีครับ'), 'kha').text, 'สวัสดีค่ะ');
  assert.equal(TH.polite.form(all.find((p) => p.text === 'โชคดีนะครับ'), 'kha').text, 'โชคดีนะคะ');
  assert.ok(TH.polite.form(all.find((p) => p.text === 'ห้าสิบบาท'), 'khrap').alt.includes('50 บาท'), 'digit forms are kept');
});
