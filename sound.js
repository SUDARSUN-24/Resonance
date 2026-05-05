// ============================================================
//  RESONANCE — sounds.js
//  Meme Soundboard + AI Voice Card Playback
//  All sounds generated via Web Audio API — no external files!
// ============================================================

(function () {

    // ── WEB AUDIO CONTEXT ──────────────────────────────────
    let ctx = null;
    function getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    // ── NOW PLAYING BAR ────────────────────────────────────
    const npBar      = document.getElementById('now-playing-bar');
    const npTitle    = document.getElementById('np-title');
    const npSubtitle = document.getElementById('np-subtitle');
    const npStop     = document.getElementById('np-stop-btn');

    function showNP(title, subtitle) {
        if (!npBar) return;
        npTitle.textContent    = title;
        npSubtitle.textContent = subtitle;
        npBar.classList.add('visible');
    }

    function hideNP() {
        if (npBar) npBar.classList.remove('visible');
    }

    // ── ACTIVE SOUND STATE ─────────────────────────────────
    let activeNodes   = [];   // Web Audio nodes currently running
    let activeSndBtn  = null; // currently lit meme button
    let activeVoiceBtn = null; // currently lit voice button

    function stopAll() {
        // Stop Web Audio nodes
        activeNodes.forEach(n => { try { n.stop(); } catch(e){} });
        activeNodes = [];

        // Stop speech synthesis
        if (window.speechSynthesis) window.speechSynthesis.cancel();

        // Reset button states
        if (activeSndBtn)   { activeSndBtn.classList.remove('playing');  activeSndBtn   = null; }
        if (activeVoiceBtn) { activeVoiceBtn.classList.remove('active'); activeVoiceBtn = null; }

        hideNP();
    }

    if (npStop) npStop.addEventListener('click', stopAll);

    // ── HELPERS ────────────────────────────────────────────
    function track(node) { activeNodes.push(node); return node; }

    function masterGain(value) {
        const g = getCtx().createGain();
        g.gain.value = value;
        g.connect(getCtx().destination);
        return g;
    }

    // Convenience: oscillator burst
    function osc(freq, type, start, dur, gainVal, gainNode) {
        const c  = getCtx();
        const o  = c.createOscillator();
        const g  = c.createGain();
        o.type      = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(gainVal, c.currentTime + start);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
        o.connect(g);
        g.connect(gainNode);
        o.start(c.currentTime + start);
        o.stop(c.currentTime  + start + dur + 0.05);
        track(o);
        return o;
    }

    // White-noise burst
    function noise(start, dur, gainVal, gainNode) {
        const c      = getCtx();
        const buf    = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
        const data   = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
        const src  = c.createBufferSource();
        const g    = c.createGain();
        src.buffer = buf;
        g.gain.setValueAtTime(gainVal, c.currentTime + start);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
        src.connect(g);
        g.connect(gainNode);
        src.start(c.currentTime + start);
        track(src);
    }

    // ── MEME SOUND SYNTHESIZERS ────────────────────────────
    const sounds = {

        bruh: function () {
            // Low descending "bruh" — pitch drop effect
            const c = getCtx();
            const mg = masterGain(0.6);
            const o = c.createOscillator();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(220, c.currentTime);
            o.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.8);
            const g = c.createGain();
            g.gain.setValueAtTime(0.6, c.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.9);
            o.connect(g); g.connect(mg);
            o.start(c.currentTime);
            o.stop(c.currentTime + 0.95);
            track(o);
            // speak it too
            synthSpeak("bruh", { rate: 0.6, pitch: 0.5 }, 'BRUH', 'Meme SFX');
        },

        vine_boom: function () {
            // Deep bass boom
            const c = getCtx();
            const mg = masterGain(1.0);
            const o = c.createOscillator();
            o.type = 'sine';
            o.frequency.setValueAtTime(150, c.currentTime);
            o.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.3);
            const g = c.createGain();
            g.gain.setValueAtTime(1.0, c.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4);
            o.connect(g); g.connect(mg);
            o.start(c.currentTime);
            o.stop(c.currentTime + 0.45);
            track(o);
            noise(0, 0.08, 0.3, mg);
            showNP('Vine Boom 💥', 'Web Audio SFX');
        },

        airhorn: function () {
            // Classic airhorn: harsh sawtooth chord
            const c  = getCtx();
            const mg = masterGain(0.5);
            [233, 311, 466].forEach((freq, i) => {
                osc(freq, 'sawtooth', i * 0.01, 1.2, 0.4, mg);
            });
            showNP('Air Horn 📯', 'Web Audio SFX');
        },

        nah_bro: function () {
            // Speaks "Are you serious right now bro" in exasperated tone
            synthSpeak("Are you serious right now bro?!", { rate: 1.1, pitch: 1.2 }, 'Are You Serious Bro 🤦', 'Meme Voice');
        },

        rizz: function () {
            // Smooth ascending arpeggio + speaks
            const c  = getCtx();
            const mg = masterGain(0.4);
            [261, 329, 392, 523].forEach((f, i) => osc(f, 'sine', i * 0.12, 0.35, 0.5, mg));
            synthSpeak("W rizz. No cap.", { rate: 0.9, pitch: 1.1 }, 'Rizz Check 😎', 'Meme Voice');
        },

        fart: function () {
            // Filtered noise fart
            const c  = getCtx();
            const mg = masterGain(0.8);
            const filter = c.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 180;
            filter.Q.value = 0.8;
            filter.connect(mg);
            const buf  = c.createBuffer(1, c.sampleRate * 0.6, c.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.sin(i / 400);
            }
            const src = c.createBufferSource();
            src.buffer = buf;
            const g = c.createGain();
            g.gain.setValueAtTime(0.9, c.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.65);
            src.connect(filter);
            g.connect(mg);
            src.connect(g);
            src.start(c.currentTime);
            track(src);
            showNP('Classic Fart 💨', 'Web Audio SFX');
        },

        nope: function () {
            // Buzzer / wrong answer
            const c  = getCtx();
            const mg = masterGain(0.7);
            osc(180, 'square', 0,    0.25, 0.7, mg);
            osc(160, 'square', 0.28, 0.25, 0.7, mg);
            osc(140, 'square', 0.56, 0.25, 0.7, mg);
            synthSpeak("Nope.", { rate: 0.85, pitch: 0.8 }, 'Nope 🚫', 'Meme Voice');
        },

        gaming_rage: function () {
            synthSpeak(
                "WHAT?! That is literally IMPOSSIBLE! This game is BROKEN! I QUIT!",
                { rate: 1.4, pitch: 1.4 },
                'Gaming Rage 🎮', 'Meme Voice'
            );
        },

        dramatic: function () {
            // Dramatic orchestral sting: low + high hit
            const c  = getCtx();
            const mg = masterGain(0.6);
            // Low hit
            osc(55,  'sawtooth', 0,    0.5, 0.8, mg);
            osc(110, 'sawtooth', 0,    0.5, 0.5, mg);
            // High stab
            osc(880, 'square',   0,    0.15, 0.3, mg);
            osc(660, 'square',   0.15, 0.15, 0.3, mg);
            noise(0, 0.12, 0.4, mg);
            showNP('Dramatic Sting 🎻', 'Web Audio SFX');
        },

        oof: function () {
            synthSpeak("Oooooof.", { rate: 0.7, pitch: 0.7 }, 'OOF 😤', 'Meme Voice');
        },

        oh_no: function () {
            // Descending "oh no" melody
            const c  = getCtx();
            const mg = masterGain(0.4);
            [523, 440, 349, 294].forEach((f, i) => osc(f, 'sine', i * 0.18, 0.25, 0.5, mg));
            synthSpeak("Oh no. Oh no. Oh no no no no.", { rate: 1.1, pitch: 1.15 }, 'Oh No Oh No 😱', 'Meme Voice');
        },

        windows_error: function () {
            // Classic 4-note Windows error chord
            const c  = getCtx();
            const mg = masterGain(0.5);
            const notes = [659, 587, 523, 494];
            notes.forEach((f, i) => osc(f, 'sine', i * 0.15, 0.2, 0.6, mg));
            showNP('Windows Error 🖥️', 'Web Audio SFX');
        }
    };

    // ── SPEECH SYNTHESIS HELPER ────────────────────────────
    function synthSpeak(text, opts, npTitleStr, npSubStr) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate   = opts.rate  || 1.0;
        u.pitch  = opts.pitch || 1.0;
        u.volume = 1;
        u.onstart = () => showNP(npTitleStr, npSubStr);
        u.onend   = hideNP;
        u.onerror = hideNP;
        window.speechSynthesis.speak(u);
    }

    // ── MEME SOUNDBOARD CLICK HANDLER ─────────────────────
    const soundboard = document.getElementById('soundboard');
    if (soundboard) {
        soundboard.addEventListener('click', function (e) {
            const btn = e.target.closest('.sound-btn');
            if (!btn) return;

            const id = btn.dataset.sound;
            const fn = sounds[id];
            if (!fn) return;

            stopAll();

            // If same button clicked twice → just stop (already done above)
            if (activeSndBtn === btn) { activeSndBtn = null; return; }

            btn.classList.add('playing');
            activeSndBtn = btn;
            fn();
        });
    }

    // ── AI VOICE CARD CLICK HANDLER ───────────────────────
    const voiceSettings = {
        robotic:    { rate: 0.65, pitch: 0.45 },
        news:       { rate: 1.2,  pitch: 1.0  },
        deep:       { rate: 0.78, pitch: 0.58 },
        calm:       { rate: 0.72, pitch: 0.9  },
        hype:       { rate: 1.35, pitch: 1.3  },
        mysterious: { rate: 0.62, pitch: 0.72 }
    };

    function roboticText(t) {
        return t.split(' ').join(' ... ');
    }

    document.querySelectorAll('.voice-play-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (!('speechSynthesis' in window)) {
                alert('Your browser does not support speech synthesis.');
                return;
            }

            // Toggle off if already active
            if (activeVoiceBtn === btn) {
                stopAll();
                return;
            }

            stopAll();

            const voiceType = btn.dataset.voice;
            let   text      = btn.dataset.text;
            const settings  = voiceSettings[voiceType] || { rate: 1.0, pitch: 1.0 };

            // Extra robotic transform
            if (voiceType === 'robotic') text = roboticText(text);

            // Load voices (sometimes async in Chrome)
            let voices = window.speechSynthesis.getVoices();

            function doSpeak(voices) {
                window.speechSynthesis.cancel();

                const u = new SpeechSynthesisUtterance(text);
                u.rate   = settings.rate;
                u.pitch  = settings.pitch;
                u.volume = 1;

                // Try to pick an appropriate voice
                if (voices.length > 0) {
                    const preferNames = {
                        robotic:    ['google', 'microsoft', 'desktop'],
                        deep:       ['david', 'mark', 'george', 'daniel'],
                        calm:       ['samantha', 'karen', 'moira', 'zira'],
                        news:       ['guy', 'jenny', 'aria'],
                        hype:       ['guy', 'mark'],
                        mysterious: ['george', 'daniel', 'david']
                    }[voiceType] || [];

                    let chosen = null;
                    for (const name of preferNames) {
                        chosen = voices.find(v => v.name.toLowerCase().includes(name));
                        if (chosen) break;
                    }
                    if (!chosen) chosen = voices[0];
                    u.voice = chosen;
                    u.lang  = chosen.lang;
                }

                const voiceLabels = {
                    robotic: 'ARIA-7 // Robotic 🤖',
                    news:    'ANCHOR // News Voice 📺',
                    deep:    'DEEP // Movie Narrator 🎙️',
                    calm:    'ZEN // Calm Guide 🧘',
                    hype:    'HYPE // Announcer 🎤',
                    mysterious: 'SHADOW // Mysterious 🌑'
                };

                u.onstart = () => {
                    showNP(voiceLabels[voiceType] || voiceType, 'AI Voice Library');
                    btn.classList.add('active');
                    activeVoiceBtn = btn;
                };
                u.onend = () => {
                    hideNP();
                    btn.classList.remove('active');
                    if (activeVoiceBtn === btn) activeVoiceBtn = null;
                };
                u.onerror = () => {
                    hideNP();
                    btn.classList.remove('active');
                };

                window.speechSynthesis.speak(u);
            }

            if (voices.length === 0) {
                // Chrome async voice load
                window.speechSynthesis.onvoiceschanged = function () {
                    voices = window.speechSynthesis.getVoices();
                    doSpeak(voices);
                };
                setTimeout(() => doSpeak(window.speechSynthesis.getVoices()), 500);
            } else {
                doSpeak(voices);
            }
        });
    });

})();