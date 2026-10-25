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

test('speaks with a chosen voice when one is given, else picks one', () => {
  const spoken = [];
  const voices = [v('Microsoft Premwadee Online (Natural) - Thai (Thailand)', 'th-TH'), v('Microsoft Pattara - Thai (Thailand)', 'th-TH')];
  const synth = { getVoices: () => voices, addEventListener() {}, cancel() {}, speak: (u) => spoken.push(u), speaking: false, pending: false };
  const window = { speechSynthesis: synth };
  function SpeechSynthesisUtterance(text) { this.text = text; }
  vm.runInNewContext(SRC, { window, SpeechSynthesisUtterance, setTimeout: () => 0, setInterval: () => 0, clearInterval() {} });
  window.RSSpeech.speak('ไก่', { lang: 'th-TH' });
  window.RSSpeech.speak('ไข่', { lang: 'th-TH', voice: voices[1], rate: 0.55 });
  assert.match(spoken[0].voice.name, /Premwadee/);
  assert.match(spoken[1].voice.name, /Pattara/);
  assert.equal(spoken[1].rate, 0.55);
  assert.equal(spoken[1].lang, 'th-TH');
});
