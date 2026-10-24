<div align="center">

# 🎙️ RESONANCE

### ✨ AI Audio Studio — Text-to-Speech in Your Browser ✨

Type any text, pick a voice, set the mood, and hear it come alive instantly. 🔊

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

[🚀 Features](#-features) • [📄 Pages](#-pages) • [⚙️ Getting Started](#️-getting-started) • [🔌 API](#-api) • [👨‍💻 Author](#-author)

</div>

---

## 📖 About

**RESONANCE** is a futuristic text-to-speech studio website. Type any text, choose a voice character, language, emotion, speed and pitch, and hear it spoken in real time using the **Web Speech API**. Voice requests can be saved to a **MySQL** database and managed from a built-in **admin panel**. 😎

---

## 🚀 Features

### 🎛️ Voice Lab
Real-time speech synthesis with live controls:

| Option | Choices |
| --- | --- |
| 🗣️ **Voice characters** | Nova, Aria‑7, Anchor, Deep, Zen, Hype, Shadow — each with its own color theme |
| 🚻 **Gender** | Male, Female |
| 🌍 **Languages** | 45+ built in (Thai, Japanese, Korean, Chinese, Hindi, Sinhala, Tamil, Arabic, Spanish, French, German and more), plus every extra language your device has voices for |
| 🔍 **Auto-detect** | Type in Thai, Japanese, Korean, Arabic, Hindi, Russian and other scripts and the language switches automatically |
| 🎧 **Device voice picker** | Picks the best natural voice for the character's gender automatically, or choose any installed voice yourself |
| 🎭 **Emotions** | Neutral, Calm, Energetic, Formal, Dramatic, Mysterious |
| 🎚️ **Fine-tuning** | Speed, pitch and volume sliders |

### 🌟 Live Stage
- 🔮 **Animated visualizer** — a glowing orb and waveform that pulse with every spoken word
- 📝 **Live captions** — each word lights up as it's spoken, with a progress bar and timer
- ⏯️ **Pause, resume and stop** — plus `Ctrl + Enter` to generate and `Esc` to stop
- ✍️ **Script templates** — greeting, headline, story, trailer, ad and *Surprise me*
- 🕘 **Recent takes** — replay your last 8 generations with their exact settings
- 🔗 **Share a take** — copy a link that opens the lab with your voice, settings and text

### 🧬 My Voice — Clone Studio
- 🎙️ **Record or upload** — up to 15 seconds from your mic (with a line to read aloud) or any audio file
- 🧬 **Voice DNA** — measures your pitch, range, pace, energy and brightness, drawn as a radar chart
- 🏆 **Voice twin** — ranks how closely you match each of the 7 Resonance characters
- 🗣️ **Speak as me** — tunes a browser voice to your pitch and pace so it can say anything you type
- 🎛️ **Voice changer** — Robot, Deep, Chipmunk, Monster, Alien, Old Radio, Phone, Cathedral, Canyon Echo and Reverse, with WAV download
- 🎧 **Live mic** — every effect except Reverse works in real time (Deep, Chipmunk and Monster use a live pitch shifter), and ⏺ **Record take** saves your transformed voice as a WAV you can play back and download
- 🔒 **Private** — your recording is processed in the browser and never uploaded

### 📲 App, Speed & Polish
- 📲 **Installable app (PWA)** — add Resonance to your home screen or desktop; pages keep working offline
- ⚡ **Performance mode** — heavy background effects switch to *lite* automatically on slower devices (or tap ✨ FX / ⚡ LITE in the menu)
- ♿ **Accessible** — keyboard focus outlines, screen-reader labels, skip link and readable contrast (Lighthouse: 100 accessibility, best practices & SEO)
- 🔗 **Link previews** — share any page and it shows a proper image and description

### 🎭 Story Studio (`/story.html`)
- ✍️ **Write any script**: `NOVA: Hello!`, `DEEP (dramatic): In a world...`, `[pause 2]`, `# Scene title`. Use any character names you like
- 🎬 **Auto-casting**: every character gets a voice (change it anytime), plus 6 ready-made stories
- 🗣️ **Live performance**: talking avatars, a speech bubble that follows the speaker, word-by-word captions, moods, speed control
- ⏯️ **Scene list**: tap any line to start from there · 🔗 share links · ⬇ download the script

### 🎮 Play: Speak to Win (`/play.html`)
- 👅 **Tongue Twister**: 5 rounds in Easy / Medium / Hard, scored on accuracy and speed with live word-by-word feedback
- 🌍 **World Tour**: hear a phrase in one of 14 languages, say it back, get scored on pronunciation
- 🗣️ **Language Practice**: 64 everyday Thai phrases in 8 topics (greetings, food, shopping, getting around…). Each phrase plays first, with a pronunciation guide, a slower replay and the meaning; say it back and it's scored like World Tour. Choose the ครับ (khrap) or ค่ะ (kha) polite ending. Your best score per phrase is saved in the browser, topics show what you've mastered, and you can replay just the tricky ones. More languages can be added in `phrases.js`
- ⚔️ **Pass & play**: two players, one device. Take turns on the same tongue twisters, hand the phone over between turns, and see round-by-round scores on the winner screen (stays on the device, not sent to the leaderboard)
- 🏆 **Live leaderboard**: all-time and weekly boards, with medals, confetti and share-your-score
- 🎙️ Uses your browser's speech recognition (Chrome, Edge or Safari)

### 📖 Reader (`/read.html`)
- 📄 **Any text**: paste it, type it, or open / drop a `.txt` file (UTF-8, UTF-16 or Windows-1252, up to 50,000 characters, about an hour of listening)
- 🌍 **Language, voice and speed**: auto-detects the script (Thai, Japanese, Arabic…) or pick any language your device has a voice for
- ✨ **Live word highlighting** that follows along and scrolls with the voice, including languages without spaces such as Thai and Japanese
- ⏯️ **Play, pause, resume and stop**; click any word (or put your cursor in the text) to start from there
- 🔒 Your text and settings stay in this browser

### 🎙️ Dictation
- The Voice Lab has a **🎙️ Dictate** button: speak instead of typing, then let any character say it back

### 🔐 Owner Dashboard (`/admin.html`)
- 🔑 **Owner-only login** — one password stored as a Netlify environment variable, never in the code
- 📊 **Live stats** — generations, page views, Voice DNA scans and producers, with ▲▼ vs the previous period
- 📈 **Charts** — daily generations & views, top voices, languages, emotions, pages, voice twins and visitor countries
- 🎮 **Play & leaderboard**: games and stories counted; remove rude names or suspicious scores in one click
- 🗂️ **Requests table** — search, filter, sort, expand, **▶ replay in the original voice**, delete, export to CSV
- 🕵️ **Privacy-friendly** — page views are anonymous counts; IPs are never stored (only a salted hash for rate limits)

### 🎵 More
- 🏠 **Interactive home** — a voice orb you can talk through, typewriter headline, clickable world greetings, spotlight cards and scroll animations
- 🎧 **Voice archive** — search, mood filters and ♥ favorites, word-by-word captions, reactive visualizers and 📻 radio mode that plays every voice
- 💾 **Save requests** — Voice Lab submissions are stored in MySQL through a PHP endpoint
- 🛠️ **Admin panel** — view, filter, paginate and delete saved requests, with summary stats
- 🌌 **Futuristic UI** — Orbitron & Outfit fonts with a fully responsive layout

---

## 📄 Pages

| File | Page | Description |
| --- | --- | --- |
| 🏠 `index.html` | Studio | Interactive home: try any voice on the orbiting voice ring, click greetings in 22 languages |
| 🎧 `services.html` | Tracks | Voice archive with search, filters, favorites, live captions and radio mode |
| 🎭 `story.html` | Story | Multi-voice story and podcast performer |
| 🎮 `play.html` | Play | Tongue Twister, World Tour and Language Practice + leaderboard |
| 🧬 `clone.html` | My Voice | Record your voice, see your Voice DNA, hear a clone of you and try 11 voice-changer effects live or on a recording |
| 🎙️ `contact.html` | Voice Lab | Text-to-speech generator and request form |
| 📖 `read.html` | Reader | Read any pasted text or .txt file aloud with live word highlighting |
| 🛠️ `admin.php` | Admin Panel | Manage saved voice requests *(requires PHP + MySQL)* |

---

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| 🎨 Frontend | HTML5, CSS3, vanilla JavaScript |
| 🔊 Audio | Web Speech API (`speechSynthesis`), Web Audio API |
| ⚙️ Backend | Netlify Functions (Node.js) · legacy PHP version for XAMPP |
| 🗄️ Storage | Netlify Blobs · legacy MySQL / MariaDB |
| 🔐 Admin | Password login, signed HttpOnly session cookie, lockout after 5 tries |

---

## 📁 Project Structure

```
resonance/
├── index.html          # 🏠 Home / Studio
├── services.html       # 🎧 Voice Tracks
├── contact.html        # 🎙️ Voice Lab
├── read.html           # 📖 Reader (read any text aloud)
├── clone.html          # 🧬 My Voice (clone studio)
├── story.html          # 🎭 Story Studio
├── play.html           # 🎮 Speak to Win challenges
├── phrases.js          # 🗣️ Language Practice phrase lists (Thai)
├── 404.html            # 🛰️ Custom "signal lost" page
├── manifest.webmanifest# 📲 App manifest (name, icons, shortcuts)
├── sw.js               # 📴 Service worker (offline cache)
├── netlify.toml        # ☁️ Netlify headers + hides PHP files
├── favicon.svg         # 🎨 App icon (vector)
├── icons/              # 🎨 PNG app icons
├── og-image.png        # 🔗 Link-preview image
├── robots.txt / sitemap.xml
├── style.css           # Styles (pages currently use inline <style>)
├── script.js           # Speech synthesis logic (pages currently use inline <script>)
├── sound.js            # Web Audio synth + tracks (pages currently use inline <script>)
├── admin.html          # 🔐 Owner dashboard (Netlify backend)
├── netlify/functions/  # ⚙️ API: requests, track, auth, admin
├── netlify/lib/        # ⚙️ Shared helpers (storage, auth)
├── package.json        # 📦 Backend dependency (@netlify/blobs)
├── admin.php           # 🛠️ Legacy admin panel (XAMPP)
├── save_request.php    # 🔌 API endpoint: saves a voice request (JSON POST)
├── db.php              # 🗄️ Database connection (PDO)
└── setup_db.sql        # Creates resonance_db and the voice_requests table
```

---

## ⚙️ Getting Started

### ⚡ Quick start (frontend only)

The text-to-speech features run entirely in the browser — no setup needed.

1. Clone the repo:
   ```bash
   git clone https://github.com/SUDARSUN-24/resonance.git
   ```
2. Open `index.html` in a modern browser. 🌐
   > 💡 Chrome or Edge recommended for the widest voice selection.

### 🔐 Backend on Netlify (recommended)

The backend runs automatically on Netlify, with no database to set up. One step is needed to unlock the dashboard:

1. In Netlify, open the site → **Site configuration** → **Environment variables** → **Add a variable**.
2. Key: `ADMIN_PASSWORD`, value: a strong password only you know.
3. **Deploys** → **Trigger deploy** → **Deploy site**.
4. Visit **`/admin.html`** on your site and log in.

> 💡 Changing `ADMIN_PASSWORD` signs out every existing session. Five wrong passwords lock that visitor out for 15 minutes.

### 🗄️ Legacy setup with PHP + MySQL (XAMPP)

1. 📦 Install a local PHP + MySQL stack such as [XAMPP](https://www.apachefriends.org/).
2. 📂 Copy the project folder into your web root (XAMPP: `htdocs/resonance`).
3. ▶️ Start **Apache** and **MySQL**.
4. 🧾 Open phpMyAdmin and run `setup_db.sql` to create the `resonance_db` database and `voice_requests` table.
5. 🔑 If your MySQL login isn't `root` with no password, update `DB_USER` and `DB_PASS` in `db.php`.
6. 🎉 Visit:
   - Site → `http://localhost/resonance/`
   - Admin → `http://localhost/resonance/admin.php`

> ⚠️ **Note:** Static hosts like Netlify and GitHub Pages can't run PHP, so saving requests and the admin panel only work on a PHP + MySQL host. On Netlify, `netlify.toml` hides the PHP files so their source isn't publicly readable.

### ☁️ Live site
Hosted on Netlify at **https://resonancesun.netlify.app** — every push to `main` deploys automatically.

### 🔒 Securing the legacy admin panel

`admin.php` (XAMPP version only) has **no login by default**. If you run it, enable the optional password check at the top of `admin.php`. The Netlify dashboard (`admin.html`) is always password-protected.

---

## 🔌 API

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `POST /api/requests` | Public (20 per 10 min) | Save a Voice Lab generation (same JSON as below) |
| `POST /api/track` | Public | Anonymous counters: `{ "type": "view", "page": "/contact.html" }` or `{ "type": "scan", "twin": "nova" }` |
| `POST /api/auth/login` · `logout` · `GET /api/auth/me` | Public | Owner login session |
| `GET /api/leaderboard?mode=twister&period=week` | Public | Top 20 scores (`twister` or `world`, `all` or `week`) |
| `POST /api/leaderboard` | Public (10 per 10 min) | Submit a score: `{ name, mode, score, accuracy, difficulty }` |
| `GET /api/admin/overview?days=30` | Owner only | Requests, daily stats and leaderboards |
| `DELETE /api/admin/leaderboard?id=…` | Owner only | Remove a leaderboard entry |
| `DELETE /api/admin/requests?id=…` | Owner only | Delete a request |

### `POST /save_request.php` (legacy) and `POST /api/requests`

**Request body (JSON):**

```json
{
  "producer_name": "Alex",
  "email": "alex@example.com",
  "voice_type": "nova",
  "voice_gender": "female",
  "language": "en-US",
  "emotion": "neutral",
  "speed": 1.0,
  "pitch": 1.0,
  "text_input": "Hello from Resonance!",
  "char_count": 21
}
```

**Rules:**
- ✅ `voice_type` and `text_input` are required
- 🎚️ Speed and pitch are clamped to `0.1 – 2.0`
- ✂️ Text is limited to 1000 characters

**Response:**

```json
{ "success": true, "id": 1, "message": "Voice request saved successfully" }
```

---

## 🌐 Browser Support

| Browser | Support |
| --- | --- |
| 🟢 Chrome | ✅ Full (most voices) |
| 🔵 Edge | ✅ Full (most voices) |
| 🟠 Firefox | ⚠️ Works, fewer voices |
| ⚪ Safari | ⚠️ Works, fewer voices |

> 🔈 Available voices depend on your device and browser.

---

## 👨‍💻 Author

<div align="center">

### **Sudasun**
*Designer & Developer — built RESONANCE from scratch* 🚀

[![GitHub](https://img.shields.io/badge/GitHub-SUDARSUN--24-181717?style=for-the-badge&logo=github)](https://github.com/SUDARSUN-24)

</div>

---

<div align="center">

⭐ **If you like this project, give it a star!** ⭐

Made with ❤️ and 🎧 by **Sudasun**

</div>
