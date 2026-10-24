/* RESONANCE progress — daily challenge, streak and badges.
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
    return {
      v: 1,
      streak: { last: null, count: 0, best: 0, days: 0 },
      daily: { key: null, best: 0, stars: 0 },
      stats: { games: 0, perfect: 0, langs: [], stories: 0, hard: 0, legend: 0 },
      badges: {},
      practice: {},  // { th: { 'สวัสดีครับ': { b: best %, s: best stars, n: tries } } }
      prefs: {}      // { 'polite.th': 'kha' }
    };
  }
  function load() {
    const st = blank();
    if (!ls) return st;
    try {
      const d = JSON.parse(ls.getItem(KEY));
      if (d && d.v === 1) {
        ['streak', 'daily', 'stats', 'badges', 'practice', 'prefs'].forEach(function (k) { if (d[k] && typeof d[k] === 'object') Object.assign(st[k], d[k]); });
        if (!Array.isArray(st.stats.langs)) st.stats.langs = [];
        Object.keys(st.practice).forEach(function (k) { if (!st.practice[k] || typeof st.practice[k] !== 'object') delete st.practice[k]; });
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

  /* ── Badges ── */
  const BADGES = [
    { id: 'first-game', icon: '🎮', name: 'First Steps', desc: 'Finish your first 5-round game', val: function (s) { return s.stats.games; } },
    { id: 'flawless', icon: '🌟', name: 'Flawless', desc: 'Score a perfect 3-star round', val: function (s) { return s.stats.perfect; } },
    { id: 'daily', icon: '📅', name: 'Daily Habit', desc: 'Complete a daily challenge', val: function (s) { return s.streak.days; } },
    { id: 'streak-3', icon: '🔥', name: 'On Fire', desc: 'Reach a 3-day streak', need: 3, val: function (s) { return s.streak.best; } },
    { id: 'streak-7', icon: '⚡', name: 'Week Warrior', desc: 'Reach a 7-day streak', need: 7, val: function (s) { return s.streak.best; } },
    { id: 'streak-30', icon: '💎', name: 'Unstoppable', desc: 'Reach a 30-day streak', need: 30, val: function (s) { return s.streak.best; } },
    { id: 'polyglot', icon: '🌍', name: 'Polyglot', desc: 'Try all 14 World Tour languages', need: 14, val: function (s) { return s.stats.langs.length; } },
    { id: 'hard-mode', icon: '🌶️', name: 'Hard Mode Hero', desc: 'Finish a Tongue Twister game on Hard', val: function (s) { return s.stats.hard; } },
    { id: 'legend', icon: '👑', name: 'Legend', desc: 'Reach Legend rank in a 5-round game', val: function (s) { return s.stats.legend; } },
    { id: 'storyteller', icon: '🎭', name: 'Storyteller', desc: 'Perform a story in Story Studio from start to finish', val: function (s) { return s.stats.stories; } }
  ];
  const listeners = [];

  function badges() {
    return BADGES.map(function (b) {
      const need = b.need || 1;
      return { id: b.id, icon: b.icon, name: b.name, desc: b.desc, need: need,
        have: Math.min(need, b.val(state) || 0), earned: state.badges[b.id] || null };
    });
  }
  // Award anything newly reached, tell listeners, return the new badges
  function check() {
    const fresh = [];
    BADGES.forEach(function (b) {
      if (!state.badges[b.id] && (b.val(state) || 0) >= (b.need || 1)) {
        state.badges[b.id] = todayKey();
        fresh.push({ id: b.id, icon: b.icon, name: b.name, desc: b.desc });
      }
    });
    if (fresh.length) save();
    fresh.forEach(function (b) { listeners.forEach(function (fn) { try { fn(b); } catch (e) {} }); });
    return fresh;
  }
  /* Events: 'round' {stars, lang}, 'game' {mode, diff, fraction}, 'story' */
  function record(type, d) {
    d = d || {};
    const st = state.stats;
    if (type === 'round') {
      if (d.stars >= 3) st.perfect++;
      if (typeof d.lang === 'string' && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(d.lang) && st.langs.indexOf(d.lang) < 0 && st.langs.length < 64) st.langs.push(d.lang);
    } else if (type === 'game') {
      st.games++;
      if (d.mode === 'twister' && d.diff === 'hard') st.hard++;
      if (d.fraction >= 0.85) st.legend++;
    } else if (type === 'story') {
      st.stories++;
    }
    save();
    return check();
  }
  check(); // quietly award anything already reached in saved progress

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
    check();
    return streak(key);
  }
  function dailyResult(key) {
    key = key || todayKey();
    return state.daily.key === key ? { best: state.daily.best, stars: state.daily.stars } : null;
  }

  /* ── Language practice: best result per phrase ── */
  const MAX_PHRASES = 2000;
  function practiceGet(code) {
    const out = {}, p = state.practice[code] || {};
    Object.keys(p).forEach(function (k) { const x = p[k]; out[k] = { best: x.b || 0, stars: x.s || 0, tries: x.n || 0 }; });
    return out;
  }
  // Returns { best, stars, tries, improved } for the phrase after this try
  function practiceSave(code, key, acc, stars) {
    if (!/^[a-z]{2,3}$/.test(code) || typeof key !== 'string' || !key || key.length > 200) return null;
    const p = state.practice[code] || (state.practice[code] = {});
    let x = p[key];
    if (!x) {
      let n = 0;
      Object.keys(state.practice).forEach(function (c) { n += Object.keys(state.practice[c]).length; });
      if (n >= MAX_PHRASES) return null;
      x = p[key] = { b: 0, s: 0, n: 0 };
    }
    const pct = Math.max(0, Math.min(100, Math.round(acc * 100))), was = x.b;
    x.n++;
    x.b = Math.max(x.b, pct);
    x.s = Math.max(x.s, Math.max(0, Math.min(3, stars | 0)));
    save();
    return { best: x.b, stars: x.s, tries: x.n, improved: x.n > 1 && pct > was };
  }
  function pref(name, value) {
    if (value === undefined) return state.prefs[name];
    if (typeof value !== 'string' || value.length > 40) return state.prefs[name];
    state.prefs[name] = value;
    save();
    return value;
  }

  root.RSProgress = {
    persistent: !!ls,
    todayKey: todayKey,
    dayNumber: dayNumber,
    dailyIndex: dailyIndex,
    streak: streak,
    completeDaily: completeDaily,
    dailyResult: dailyResult,
    record: record,
    badges: badges,
    practiceGet: practiceGet,
    practiceSave: practiceSave,
    pref: pref,
    onUnlock: function (fn) { listeners.push(fn); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
