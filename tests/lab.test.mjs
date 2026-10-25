// The Music Lab's timing and arrangement: where steps, chords and clips land in the song, how playback
// splits into loop passes, how a recorded take is lined up, and how long the exported mix is.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../lab.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const a = SRC.indexOf('/* LAB:start'), b = SRC.indexOf('/* LAB:end */');
assert.ok(a > -1 && b > a, 'timing code not found in lab.html');
const L = vm.runInNewContext(SRC.slice(a, b) + '\n({STEPS,DRUMS,BEATS,MODES,PROGS,HITS,barLen,stepTime,snapNum,chord,clipStart,songEvents,loopWindows,takeOffset,exportFrames})');
const close = (x, y, msg) => assert.ok(Math.abs(x - y) < 1e-9, `${msg}: ${x} vs ${y}`);
const empty = { bpm: 120, swing: 0, bars: 1, pattern: {}, click: false, chords: { on: false }, tracks: [] };
const song = (over) => Object.assign({}, empty, over);

test('every beat preset is 16 steps of known drums with a tempo in range', () => {
  const names = L.DRUMS.map((d) => d[0]);
  for (const [name, p] of Object.entries(L.BEATS)) {
    assert.ok(p.bpm >= 60 && p.bpm <= 180, `${name}: bpm ${p.bpm}`);
    assert.ok(p.swing >= 0 && p.swing <= 50, `${name}: swing ${p.swing}`);
    for (const [k, v] of Object.entries(p)) {
      if (k === 'bpm' || k === 'swing') continue;
      assert.ok(names.includes(k), `${name}: unknown drum ${k}`);
      assert.match(v, /^[x.]{16}$/, `${name}.${k} is not 16 steps`);
    }
  }
});

test('a bar is four beats and steps are 16ths, with swing on every second one', () => {
  close(L.barLen(120), 2, 'bar at 120');
  close(L.stepTime(4, 120, 0), 0.5, 'beat 2');
  close(L.stepTime(1, 120, 0), 0.125, 'second 16th');
  close(L.stepTime(1, 120, 50), 0.1875, 'swung by half a 16th');
  close(L.stepTime(2, 120, 50), 0.25, 'on-beat 16ths do not move');
});

test('chords are built from the scale and named', () => {
  const names = (key, mode, prog) => prog.map((d) => L.chord(key, mode, d).name).join(' ');
  assert.equal(names(0, 'major', [0, 4, 5, 3]), 'C G Am F');
  assert.equal(names(9, 'minor', [0, 5, 2, 6]), 'Am F C G');
  assert.equal(L.chord(0, 'major', 6).name, 'B°');
  const c = L.chord(0, 'major', 0);
  assert.equal(c.notes.join(), '48,52,55', 'C E G around C3');
  assert.equal(c.bass, 36);
  for (let key = 0; key < 12; key++) for (const mode of ['major', 'minor']) for (let d = 0; d < 7; d++) {
    const ch = L.chord(key, mode, d);
    assert.ok(ch.notes[0] >= 44 && ch.notes[0] <= 55, `root ${ch.notes[0]} stays in range`);
  }
  for (const [name, prog] of L.PROGS) assert.ok(prog.every((d) => d >= 0 && d < 7), name);
});

test('drum hits land on their steps in every bar, in time order', () => {
  const ev = L.songEvents(song({ bars: 2, pattern: { kick: 'x...x...........', hat: 'x.x.............' } }), 0, 99);
  assert.equal(ev.map((e) => `${e.name}@${e.t}`).join(' '), 'kick@0 hat@0 hat@0.25 kick@0.5 kick@2 hat@2 hat@2.25 kick@2.5');
});

test('only events inside the window are returned, and nothing past the song', () => {
  const s = song({ pattern: { hat: 'x'.repeat(16) } });
  assert.equal(L.songEvents(s, 0.5, 1).length, 4);
  assert.equal(L.songEvents(s, 1.9, 5).length, 0, 'the song is one 2 s bar');
});

test('chords play their hits each bar, with the bass and metronome', () => {
  const s = song({ bars: 2, click: true, chords: { on: true, key: 0, mode: 'major', prog: [0, 4], sound: 'keys', bass: true } });
  const ev = L.songEvents(s, 0, 99);
  assert.equal(ev.filter((e) => e.kind === 'chord').length, 4, 'keys: two hits a bar');
  assert.equal(ev.filter((e) => e.kind === 'bass').length, 4);
  assert.equal(ev.filter((e) => e.kind === 'click').length, 8);
  assert.equal(ev.filter((e) => e.kind === 'click' && e.accent).length, 2);
  assert.equal(ev.find((e) => e.kind === 'chord' && e.t === 2).notes.join(), L.chord(0, 'major', 4).notes.join(), 'bar 2 is the second chord');
  for (const [sound, hits] of Object.entries(L.HITS)) assert.ok(hits.every((h) => h[0] >= 0 && h[0] + h[1] <= 1), `${sound} stays in the bar`);
});

test('clips start at their bar plus the nudge, and are cut at the end of the song', () => {
  close(L.clipStart(2, 50, 120), 2.05, 'bar 2 + 50 ms');
  const at = (tr) => L.songEvents(song({ bars: 4, tracks: [tr] }), 0, 99)[0];
  const c = at({ len: 3, startBar: 3, nudge: 0 });
  assert.deepEqual([c.t, c.offset, c.dur], [4, 0, 3]);
  const cut = at({ len: 10, startBar: 4, nudge: 0 });
  assert.equal(cut.dur, 2, 'only the last bar is left');
  const early = at({ len: 3, startBar: 1, nudge: -200 });
  close(early.t, 0, 'cannot start before the song');
  close(early.offset, 0.2, 'the early part is skipped');
  close(early.dur, 2.8, 'and the rest plays');
  assert.equal(L.songEvents(song({ bars: 1, tracks: [{ len: 1, startBar: 5, nudge: 0 }] }), 0, 99).length, 0, 'a clip after the end does not play');
});

test('playback splits at the loop, and stops at the end without loop', () => {
  const w = L.loopWindows(1.9, 2.3, 2, true);
  assert.equal(JSON.stringify(w.map((x) => x.map((v) => +v.toFixed(6)))), '[[1.9,2,0],[0,0.3,2]]');
  assert.equal(L.loopWindows(1.9, 2.3, 2, false).length, 1);
  assert.equal(L.loopWindows(2.1, 2.3, 2, false).length, 0);
  let covered = 0;
  for (const [x, y] of L.loopWindows(0, 9, 2, true)) covered += y - x;
  close(covered, 9, 'no gaps or overlaps');
});

test('a take is lined up with the song start, after the speaker and mic delay', () => {
  assert.equal(L.takeOffset(10, 12, 0, 48000), 96000, 'two seconds of count-in are dropped');
  assert.equal(L.takeOffset(10, 12, 0.05, 48000), 98400, 'and the round trip delay too');
});

test('the mix is the song plus a tail for the last notes to ring out', () => {
  assert.equal(L.exportFrames(4, 120, 44100, 1.2), Math.ceil(9.2 * 44100));
  assert.equal(L.exportFrames(1, 90, 48000, 0), Math.ceil(240 / 90 * 48000));
});

test('typed numbers snap to the range and step', () => {
  assert.equal(L.snapNum(999, 60, 180, 1), 180);
  assert.equal(L.snapNum(37, -500, 500, 5), 35);
  assert.equal(L.snapNum('abc', 0, 50, 5), 0);
});
