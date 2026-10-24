/* RESONANCE progress — daily challenge and streak.
   Saved in this browser only (localStorage), never sent anywhere.
   Classic script: pages read it as window.RSProgress. */
(function (root) {
  const KEY = 'resonance_progress';

  /* ── Storage: localStorage when allowed, memory when blocked ── */
  let ls = null;
  try {
    const s = root.localStorage, t = '__rs_probe';
    s.setItem(t, '1'); s.removeItem(t); ls = s;
  } catch (e) { ls = null; }

  function blank() {
    return { v: 1, streak: { last: null, count: 0, best: 0, days: 0 }, daily: { key: null, best: 0, stars: 0 } };
  }
  function load() {
    const st = blank();
    if (!ls) return st;
    try {
      const d = JSON.parse(ls.getItem(KEY));
      if (d && d.v === 1) {
        Object.assign(st.streak, d.streak);
        Object.assign(st.daily, d.daily);
      }
    } catch (e) {}
    return st;
  }
  let state = load();
  function save() {
    if (!ls) return;
    try { ls.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ── Dates: local calendar day as YYYY-MM-DD ── */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  // Whole days since 1970-01-01, from the date parts only (no time zones, no DST)
  function dayNumber(key) {
    const p = String(key).split('-').map(Number);
    return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5);
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  // The same pick for everyone on the same date. A stride coprime with n
  // walks the whole pool before any phrase repeats.
  function dailyIndex(key, n) {
    if (n < 2) return 0;
    let s = Math.floor(n * 0.618) || 1;
    while (gcd(s, n) !== 1) s++;
    const d = dayNumber(key);
    return ((d * s) % n + n) % n;
  }

  /* ── Streak ── */
  function streak(key) {
    key = key || todayKey();
    const s = state.streak, gap = s.last ? dayNumber(key) - dayNumber(s.last) : Infinity;
    return { count: gap <= 1 ? s.count : 0, best: s.best, days: s.days, playedToday: gap === 0 };
  }
  // Call once a daily round has a score. Returns the updated streak.
  function completeDaily(result, key) {
    key = key || todayKey();
    const s = state.streak;
    const gap = s.last ? dayNumber(key) - dayNumber(s.last) : Infinity;
    if (gap !== 0) {
      s.count = gap === 1 ? s.count + 1 : 1;
      s.last = key;
      s.days++;
      s.best = Math.max(s.best, s.count);
    }
    if (state.daily.key !== key) state.daily = { key: key, best: 0, stars: 0 };
    state.daily.best = Math.max(state.daily.best, result.score || 0);
    state.daily.stars = Math.max(state.daily.stars, result.stars || 0);
    save();
    return streak(key);
  }
  function dailyResult(key) {
    key = key || todayKey();
    return state.daily.key === key ? { best: state.daily.best, stars: state.daily.stars } : null;
  }

  root.RSProgress = {
    persistent: !!ls,
    todayKey: todayKey,
    dayNumber: dayNumber,
    dailyIndex: dailyIndex,
    streak: streak,
    completeDaily: completeDaily,
    dailyResult: dailyResult
  };
})(typeof window !== 'undefined' ? window : globalThis);
