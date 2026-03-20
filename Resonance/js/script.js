window.onload = function () {
    console.log("RESONANCE Engine Active: 5 Features Running");

    // ==========================================
    // 1. DATE AND TIME DISPLAY
    // ==========================================
    const clockDisplay = document.getElementById('live-clock');
    if (clockDisplay) {
        function updateTime() {
            const now = new Date();
            const dateStr = now.toLocaleDateString();
            const timeStr = now.toLocaleTimeString();
            clockDisplay.innerHTML = `<span style="color: var(--primary);">●</span> SYS.TIME: ${dateStr} | ${timeStr}`;
        }
        updateTime();
        setInterval(updateTime, 1000);
    }

    // ==========================================
    // 2. LIGHT/DARK MODE TOGGLE
    // ==========================================
    const themeBtn = document.getElementById('theme-toggle');
    try {
        if (localStorage.getItem('resonance_theme') === 'light') {
            document.body.classList.add('light-theme');
        }
    } catch (e) {
        console.log("Storage blocked");
    }

    if (themeBtn) {
        themeBtn.onclick = function () {
            document.body.classList.toggle('light-theme');
            try {
                if (document.body.classList.contains('light-theme')) {
                    localStorage.setItem('resonance_theme', 'light');
                } else {
                    localStorage.setItem('resonance_theme', 'dark');
                }
            } catch (e) {
                console.log("Storage blocked");
            }
        };
    }

    // ==========================================
    // 3. SHOW/HIDE CONTENT
    // ==========================================
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    for (let i = 0; i < toggleBtns.length; i++) {
        toggleBtns[i].onclick = function (e) {
            const targetId = e.target.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.classList.toggle('hidden');
                e.target.innerText = targetElement.classList.contains('hidden')
                    ? 'VIEW TRACK SPECS'
                    : 'HIDE TRACK SPECS';
            }
        };
    }

    // ==========================================
    // 4. VOICE SYNTHESIS SYSTEM
    // ==========================================
    const cloneForm = document.getElementById('clone-form');
    const languageSelect = document.getElementById('language-select');
    const styleSelect = document.getElementById('style-select');
    const characterSelect = document.getElementById('character-select');
    const previewVoiceBtn = document.getElementById('preview-voice');
    const stopVoiceBtn = document.getElementById('stop-voice');
    const voiceStatus = document.getElementById('voice-status');

    let availableVoices = [];

    const languageMap = {
        en: 'en',
        th: 'th',
        ja: 'ja',
        ko: 'ko',
        es: 'es',
        fr: 'fr',
        de: 'de',
        it: 'it',
        hi: 'hi'
    };

    function loadVoices() {
        if (!('speechSynthesis' in window)) return;
        availableVoices = window.speechSynthesis.getVoices();
    }

    function getVoicesByLanguage(langCode) {
        return availableVoices.filter((voice) =>
            voice.lang.toLowerCase().startsWith(langCode.toLowerCase())
        );
    }

    function getCharacterKeywords(character) {
        if (character === 'man') {
            return ['david', 'mark', 'guy', 'george', 'male', 'daniel', 'alex'];
        }
        if (character === 'woman') {
            return ['zira', 'aria', 'samantha', 'jenny', 'female', 'susan', 'eva'];
        }
        if (character === 'robotic') {
            return ['google', 'microsoft', 'desktop', 'robot', 'synth', 'ai'];
        }
        return [];
    }

    function scoreVoice(voice, langCode, character, style) {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        let score = 0;

        if (lang.startsWith(langCode.toLowerCase())) {
            score += 40;
        }

        const keywords = getCharacterKeywords(character);
        for (let i = 0; i < keywords.length; i++) {
            if (name.includes(keywords[i])) {
                score += 18;
            }
        }

        if (character === 'man') {
            if (
                name.includes('female') ||
                name.includes('zira') ||
                name.includes('aria') ||
                name.includes('samantha') ||
                name.includes('jenny')
            ) {
                score -= 15;
            }
        }

        if (character === 'woman') {
            if (
                name.includes('male') ||
                name.includes('david') ||
                name.includes('mark') ||
                name.includes('guy') ||
                name.includes('george')
            ) {
                score -= 15;
            }
        }

        if (character === 'robotic') {
            score += 10;
        }

        if (style === 'deep') {
            if (name.includes('david') || name.includes('mark') || name.includes('george')) {
                score += 12;
            }
        }

        if (style === 'news') {
            if (name.includes('guy') || name.includes('jenny') || name.includes('aria')) {
                score += 10;
            }
        }

        if (style === 'formal' || style === 'professional') {
            if (
                name.includes('david') ||
                name.includes('mark') ||
                name.includes('samantha') ||
                name.includes('aria')
            ) {
                score += 8;
            }
        }

        return score;
    }

    function pickBestVoice(langCode, character, style) {
        const matchingVoices = getVoicesByLanguage(langCode);
        const pool = matchingVoices.length > 0 ? matchingVoices : availableVoices;

        if (pool.length === 0) return null;

        let bestVoice = null;
        let bestScore = -9999;

        for (let i = 0; i < pool.length; i++) {
            const voice = pool[i];
            const score = scoreVoice(voice, langCode, character, style);

            if (score > bestScore) {
                bestScore = score;
                bestVoice = voice;
            }
        }

        return bestVoice;
    }

    function getStyleSettings(style, character) {
        let settings = {
            rate: 1.0,
            pitch: 1.0
        };

        switch (style) {
            case 'calm':
                settings.rate = 0.75;
                settings.pitch = character === 'woman' ? 1.05 : 0.9;
                break;

            case 'deep':
                settings.rate = 0.78;
                settings.pitch = character === 'woman' ? 0.9 : 0.6;
                break;

            case 'mysterious':
                settings.rate = 0.65;
                settings.pitch = character === 'woman' ? 0.95 : 0.7;
                break;

            case 'news':
                settings.rate = 1.18;
                settings.pitch = 1.0;
                break;

            case 'formal':
                settings.rate = 0.88;
                settings.pitch = 0.9;
                break;

            case 'professional':
                settings.rate = 0.95;
                settings.pitch = 0.92;
                break;

            default:
                settings.rate = 1.0;
                settings.pitch = 1.0;
        }

        if (character === 'robotic') {
            settings.rate = 0.68;
            settings.pitch = 0.55;
        }

        return settings;
    }

    function transformTextForStyle(text, style, character, isPreview) {
        let output = text.trim();

        if (style === 'calm') {
            output = output.replace(/,/g, '... ');
        }

        if (style === 'deep') {
            output = output.replace(/\./g, '... ');
        }

        if (style === 'mysterious') {
            output = output
                .replace(/,/g, '... ')
                .replace(/\./g, '... ')
                .replace(/!/g, '... ')
                .replace(/\?/g, '... ');
        }

        if (style === 'news') {
            output = output
                .replace(/:/g, '. ')
                .replace(/;/g, '. ');
        }

        if (style === 'formal') {
            output = output.replace(/!/g, '.');
        }

        if (style === 'professional') {
            output = output.replace(/!/g, '.');
        }

        if (character === 'robotic') {
            output = output
                .replace(/,/g, ' ... ')
                .replace(/\./g, ' ... ')
                .replace(/\?/g, ' ... ')
                .replace(/!/g, ' ... ');

            if (output.length < 120) {
                output = output.split(' ').join(' ... ');
            }
        }

        if (isPreview && character === 'robotic') {
            output = 'System ... online ... voice ... synthesis ... active ...';
        }

        return output;
    }

    function speakText(text, isPreview = false) {
        if (!('speechSynthesis' in window)) {
            alert("AUDIO ERROR: This browser does not support voice synthesis.");
            return;
        }

        const langCode = languageSelect ? languageMap[languageSelect.value] : 'en';
        const style = styleSelect ? styleSelect.value : 'calm';
        const character = characterSelect ? characterSelect.value : 'man';

        const chosenVoice = pickBestVoice(langCode, character, style);
        const settings = getStyleSettings(style, character);
        const processedText = transformTextForStyle(text, style, character, isPreview);

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(processedText);
        utterance.lang = langCode;
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = 1;

        if (chosenVoice) {
            utterance.voice = chosenVoice;
            utterance.lang = chosenVoice.lang;
        }

        utterance.onstart = function () {
            if (voiceStatus) {
                if (isPreview) {
                    voiceStatus.textContent = `VOICE PREVIEW ACTIVE: ${style.toUpperCase()} / ${character.toUpperCase()}`;
                } else {
                    voiceStatus.textContent = `VOICE ONLINE: ${style.toUpperCase()} / ${character.toUpperCase()}`;
                }
            }
        };

        utterance.onend = function () {
            if (voiceStatus) {
                voiceStatus.textContent = "SYNTHESIS COMPLETE: Playback finished.";
            }
        };

        utterance.onerror = function () {
            if (voiceStatus) {
                voiceStatus.textContent = "AUDIO ERROR: Voice generation failed.";
            }
        };

        window.speechSynthesis.speak(utterance);
    }

    if ('speechSynthesis' in window) {
        loadVoices();

        if (typeof speechSynthesis.onvoiceschanged !== "undefined") {
            speechSynthesis.onvoiceschanged = loadVoices;
        }

        setTimeout(loadVoices, 300);
        setTimeout(loadVoices, 1000);
        setTimeout(loadVoices, 2000);
    }

    if (previewVoiceBtn) {
        previewVoiceBtn.onclick = function () {
            const selectedLang = languageSelect ? languageSelect.value : 'en';
            const style = styleSelect ? styleSelect.value : 'calm';
            const character = characterSelect ? characterSelect.value : 'man';

            const previewTextMap = {
                en: "Welcome to Resonance. Voice preview is now active.",
                th: "ยินดีต้อนรับสู่เรโซแนนซ์ ระบบพรีวิวเสียงกำลังทำงาน",
                ja: "レゾナンスへようこそ。音声プレビューを開始します。",
                ko: "레조넌스에 오신 것을 환영합니다. 음성 미리보기를 시작합니다.",
                es: "Bienvenido a Resonance. La vista previa de voz está activa.",
                fr: "Bienvenue sur Resonance. L'aperçu vocal est actif.",
                de: "Willkommen bei Resonance. Die Sprachvorschau ist aktiv.",
                it: "Benvenuto su Resonance. Anteprima vocale attiva.",
                hi: "रेज़ोनेंस में आपका स्वागत है। वॉइस प्रीव्यू सक्रिय है।"
            };

            let previewText = previewTextMap[selectedLang] || previewTextMap.en;

            if (style === 'news') {
                previewText = "This is Resonance News. Voice system online and ready.";
            }

            if (style === 'mysterious') {
                previewText = "Welcome... to Resonance... the signal is alive.";
            }

            if (style === 'deep') {
                previewText = "Resonance system online. Deep voice channel engaged.";
            }

            if (style === 'formal') {
                previewText = "Welcome to Resonance. Your voice system is now ready for operation.";
            }

            if (style === 'professional') {
                previewText = "Resonance voice engine initialized successfully.";
            }

            if (character === 'robotic') {
                previewText = "System online. Resonance voice engine active.";
            }

            speakText(previewText, true);
        };
    }

    if (cloneForm) {
        cloneForm.onsubmit = function (e) {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const text = document.getElementById('project-details').value.trim();

            if (!name) {
                alert("AUDIO ERROR: Producer Alias is required.");
                return;
            }

            if (!email.includes('@') || !email.includes('.')) {
                alert("AUDIO ERROR: Invalid client email uplink.");
                return;
            }

            if (text.length < 3) {
                alert("AUDIO ERROR: Please enter text for voice generation.");
                return;
            }

            speakText(text, false);
        };
    }

    if (stopVoiceBtn) {
        stopVoiceBtn.onclick = function () {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }

            if (voiceStatus) {
                voiceStatus.textContent = "VOICE HALTED: Playback stopped.";
            }
        };
    }

    // ==========================================
    // 5. MOBILE MENU TOGGLE
    // ==========================================
    const mobileBtn = document.getElementById('mobile-btn');
    const navLinks = document.getElementById('nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.onclick = function () {
            navLinks.classList.toggle('active');
        };
    }
};