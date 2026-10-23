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
- 🎛️ **Voice changer** — Robot, Chipmunk, Monster, Alien, Old Radio, Phone, Cathedral, Canyon Echo and Reverse, with a live-mic mode and WAV download
- 🔒 **Private** — your recording is processed in the browser and never uploaded

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
| 🧬 `clone.html` | My Voice | Record your voice, see your Voice DNA, hear a clone of you and try 10 voice-changer effects |
| 🎙️ `contact.html` | Voice Lab | Text-to-speech generator and request form |
| 🛠️ `admin.php` | Admin Panel | Manage saved voice requests *(requires PHP + MySQL)* |

---

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| 🎨 Frontend | HTML5, CSS3, vanilla JavaScript |
| 🔊 Audio | Web Speech API (`speechSynthesis`), Web Audio API |
| ⚙️ Backend | PHP (PDO) |
| 🗄️ Database | MySQL / MariaDB |

---

## 📁 Project Structure

```
resonance/
├── index.html          # 🏠 Home / Studio
├── services.html       # 🎧 Voice Tracks
├── contact.html        # 🎙️ Voice Lab
├── clone.html          # 🧬 My Voice (clone studio)
├── style.css           # Styles (pages currently use inline <style>)
├── script.js           # Speech synthesis logic (pages currently use inline <script>)
├── sound.js            # Web Audio synth + tracks (pages currently use inline <script>)
├── admin.php           # 🛠️ Admin panel
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

### 🗄️ Full setup (save requests + admin panel)

1. 📦 Install a local PHP + MySQL stack such as [XAMPP](https://www.apachefriends.org/).
2. 📂 Copy the project folder into your web root (XAMPP: `htdocs/resonance`).
3. ▶️ Start **Apache** and **MySQL**.
4. 🧾 Open phpMyAdmin and run `setup_db.sql` to create the `resonance_db` database and `voice_requests` table.
5. 🔑 If your MySQL login isn't `root` with no password, update `DB_USER` and `DB_PASS` in `db.php`.
6. 🎉 Visit:
   - Site → `http://localhost/resonance/`
   - Admin → `http://localhost/resonance/admin.php`

> ⚠️ **Note:** GitHub Pages only serves static files, so the PHP features (saving requests and the admin panel) won't work there. Use a host that supports PHP and MySQL for the full experience.

### 🔒 Securing the admin panel

`admin.php` has **no login by default**. Before deploying publicly, enable the optional password check at the top of `admin.php`.

---

## 🔌 API

### `POST /save_request.php`

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
