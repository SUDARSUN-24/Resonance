// Checks the shared speech engine (speech.js) with a pretend list of device voices
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../speech.js', import.meta.url), 'utf8');

function engine(voices) {
  const synth = { getVoices: () => voices, addEventListener() {}, cancel() {}, speak() {} };
  const window = { speechSynthesis: synth };
  vm.runInNewContext(SRC, { window, setTimeout: () => 0, setInterval: () => 0, clearInterval() {} });
  return window.RSSpeech;
}
const v = (name, lang) => ({ name, lang, voiceURI: name });

test('loads without a browser and says speech is unsupported', () => {
  const window = {};
  vm.runInNewContext(SRC, { window, setTimeout: () => 0 });
  assert.equal(window.RSSpeech.supported, false);
  assert.equal(window.RSSpeech.has('th-TH'), false);
});

test('finds a Thai voice, and reports when there is none', () => {
  const withThai = engine([v('Microsoft David - English (United States)', 'en-US'), v('Microsoft Pattara - Thai (Thailand)', 'th-TH')]);
  assert.equal(withThai.ready(), true);
  assert.equal(withThai.has('th-TH'), true);
  assert.equal(withThai.pick('th-TH').name, 'Microsoft Pattara - Thai (Thailand)');
  const noThai = engine([v('Microsoft David - English (United States)', 'en-US')]);
  assert.equal(noThai.has('th-TH'), false);
  assert.equal(noThai.pick('th-TH'), null);
});

test('prefers natural voices and the asked-for gender', () => {
  const e = engine([v('Microsoft Pattara - Thai (Thailand)', 'th-TH'), v('Microsoft Premwadee Online (Natural) - Thai (Thailand)', 'th-TH'), v('Microsoft Niwat Online (Natural) - Thai (Thailand)', 'th-TH')]);
  assert.match(e.pick('th-TH', 'female').name, /Premwadee/);
  assert.match(e.pick('th-TH', 'male').name, /Niwat/);
});

test('accepts underscores and a region-less match', () => {
  const e = engine([v('Thai voice', 'th_TH')]);
  assert.equal(e.has('th-TH'), true);
  assert.equal(e.has('th'), true);
});
