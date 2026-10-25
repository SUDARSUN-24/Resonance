/* RESONANCE voice library: the saved versions shared by My Voice, Voice Lab and Music Lab.
   Kept in this browser (IndexedDB) so they can be played and downloaded later, and never uploaded.
   If the browser blocks storage, versions are kept in this tab instead and onBlocked is called once.
   A version is {id, created, label, secs, file, blob}; kind says where it came from (optional).
   wav() turns raw samples into a WAV file for saving or downloading. */
(function (root) {
  const DB = 'resonance-voice', STORE = 'versions';

  function create(onBlocked, idb) {
    idb = idb === undefined ? root.indexedDB : idb;
    let mem = null, memId = 0, dbp = null;
    function open() {
      if (!dbp) dbp = new Promise(function (res, rej) {
        try {
          const r = idb.open(DB, 1);
          r.onupgradeneeded = function () { r.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true }); };
          r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
        } catch (e) { rej(e); }
      });
      return dbp;
    }
    function run(mode, fn) {
      return open().then(function (db) {
        return new Promise(function (res, rej) {
          const t = db.transaction(STORE, mode), q = fn(t.objectStore(STORE));
          t.oncomplete = function () { res(q.result); }; t.onerror = t.onabort = function () { rej(t.error); };
        });
      });
    }
    function toMemory() {
      if (mem) return;
      mem = [];
      if (onBlocked) onBlocked();
    }
    return {
      all: function () { return mem ? Promise.resolve(mem.slice()) : run('readonly', function (s) { return s.getAll(); }).catch(function () { toMemory(); return []; }); },
      get: function (id) { return this.all().then(function (list) { return list.find(function (r) { return r.id === id; }) || null; }); },
      /* Resolves with the new version's id */
      add: function (rec) {
        if (mem) { rec.id = ++memId; mem.push(rec); return Promise.resolve(rec.id); }
        return run('readwrite', function (s) { return s.add(rec); }).catch(function () { toMemory(); rec.id = ++memId; mem.push(rec); return rec.id; });
      },
      del: function (id) { if (mem) { mem = mem.filter(function (r) { return r.id !== id; }); return Promise.resolve(); } return run('readwrite', function (s) { return s.delete(id); }); },
      clear: function () { if (mem) { mem = []; return Promise.resolve(); } return run('readwrite', function (s) { return s.clear(); }); }
    };
  }

  /* 16-bit WAV from one Float32Array per channel */
  function wav(chans, sr) {
    const ch = chans.length, n = chans[0].length, bytes = 44 + n * ch * 2, view = new DataView(new ArrayBuffer(bytes));
    const str = function (o, s) { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); view.setUint32(4, bytes - 8, true); str(8, 'WAVE'); str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, ch, true); view.setUint32(24, sr, true); view.setUint32(28, sr * ch * 2, true); view.setUint16(32, ch * 2, true); view.setUint16(34, 16, true);
    str(36, 'data'); view.setUint32(40, n * ch * 2, true);
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, chans[c][i] || 0)); view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2; }
    return new Blob([view], { type: 'audio/wav' });
  }

  root.VoiceStore = { create: create, wav: wav, MAX: 12 };
})(typeof window !== 'undefined' ? window : globalThis);
