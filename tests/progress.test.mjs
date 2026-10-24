// Unit tests for progress.js (run with: npm test)
// The file is a classic browser script, so it is loaded into a sandbox with a fake window.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../progress.js', import.meta.url), 'utf8');

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; }
  };
}
const blockedStorage = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('SecurityError'); },
  removeItem() { throw new Error('SecurityError'); }
};
function load(storage = memoryStorage()) {
  const window = { localStorage: storage };
  vm.runInNewContext(SRC, { window });
  return window.RSProgress;
}

test('todayKey uses the local calendar date', () => {
  const P = load();
  assert.equal(P.todayKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(P.todayKey(new Date(2026, 9, 24, 0, 0)), '2026-10-24');
});

test('dayNumber counts whole days, including across DST changes', () => {
  const P = load();
  assert.equal(P.dayNumber('1970-01-02'), 1);
  assert.equal(P.dayNumber('2026-03-29') - P.dayNumber('2026-03-28'), 1);
  assert.equal(P.dayNumber('2026-11-01') - P.dayNumber('2026-10-31'), 1);
  assert.equal(P.dayNumber('2027-01-01') - P.dayNumber('2026-12-31'), 1);
});

test('dailyIndex is the same for the same date and always in range', () => {
  const P = load();
  assert.equal(P.dailyIndex('2026-10-24', 38), P.dailyIndex('2026-10-24', 38));
  assert.equal(load().dailyIndex('2026-10-24', 38), P.dailyIndex('2026-10-24', 38));
  for (const n of [1, 2, 7, 10, 38, 64]) {
    const i = P.dailyIndex('2026-10-24', n);
    assert.ok(i >= 0 && i < n, `index ${i} out of range for ${n}`);
  }
});

test('dailyIndex visits every phrase once before repeating', () => {
  const P = load();
  for (const n of [10, 38, 40, 64]) {
    const seen = new Set();
    const start = P.dayNumber('2026-10-24');
    for (let d = 0; d < n; d++) {
      const date = new Date(Date.UTC(1970, 0, 1 + start + d));
      const key = date.toISOString().slice(0, 10);
      seen.add(P.dailyIndex(key, n));
    }
    assert.equal(seen.size, n, `pool of ${n} repeated early`);
  }
});

test('dailyIndex changes from one day to the next', () => {
  const P = load();
  assert.notEqual(P.dailyIndex('2026-10-24', 38), P.dailyIndex('2026-10-25', 38));
});

test('streak: first day, same day, next day, missed day', () => {
  const P = load();
  assert.deepEqual({ ...P.streak('2026-10-20') }, { count: 0, best: 0, days: 0, playedToday: false });

  assert.equal(P.completeDaily({ score: 500, stars: 1 }, '2026-10-20').count, 1);
  assert.equal(P.completeDaily({ score: 900, stars: 3 }, '2026-10-20').count, 1, 'same day does not add');
  assert.equal(P.completeDaily({ score: 100, stars: 0 }, '2026-10-21').count, 2);
  assert.equal(P.completeDaily({ score: 100, stars: 0 }, '2026-10-22').count, 3);

  // Missing a day breaks the current streak but keeps the best
  const broken = P.streak('2026-10-24');
  assert.equal(broken.count, 0);
  assert.equal(broken.best, 3);

  const restart = P.completeDaily({ score: 100, stars: 0 }, '2026-10-24');
  assert.equal(restart.count, 1);
  assert.equal(restart.best, 3);
  assert.equal(restart.days, 4);
});

test('streak is still shown the day after playing', () => {
  const P = load();
  P.completeDaily({ score: 1, stars: 0 }, '2026-10-23');
  const s = P.streak('2026-10-24');
  assert.equal(s.count, 1);
  assert.equal(s.playedToday, false);
});

test('daily result keeps the best score of the day only', () => {
  const P = load();
  P.completeDaily({ score: 700, stars: 2 }, '2026-10-24');
  P.completeDaily({ score: 400, stars: 1 }, '2026-10-24');
  assert.deepEqual({ ...P.dailyResult('2026-10-24') }, { best: 700, stars: 2 });
  assert.equal(P.dailyResult('2026-10-25'), null);
});

test('progress is saved and read back from storage', () => {
  const storage = memoryStorage();
  load(storage).completeDaily({ score: 800, stars: 2 }, '2026-10-24');
  assert.ok(storage.data.resonance_progress);
  const again = load(storage);
  assert.equal(again.persistent, true);
  assert.equal(again.streak('2026-10-24').count, 1);
});

test('corrupt saved data falls back to a fresh start', () => {
  const P = load(memoryStorage({ resonance_progress: '{not json' }));
  assert.equal(P.streak('2026-10-24').count, 0);
});

test('blocked storage still works for the session without throwing', () => {
  const P = load(blockedStorage);
  assert.equal(P.persistent, false);
  assert.equal(P.completeDaily({ score: 1, stars: 0 }, '2026-10-24').count, 1);
  assert.equal(P.streak('2026-10-24').playedToday, true);
});

test('missing localStorage (old browsers, sandboxed frames) does not throw', () => {
  const window = {};
  vm.runInNewContext(SRC, { window });
  assert.equal(window.RSProgress.persistent, false);
});
