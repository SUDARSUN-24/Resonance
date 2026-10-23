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
| 🗣️ **Voice characters** | Nova, Deep, Calm, Hype, News, Mysterious, Robotic |
| 🚻 **Gender** | Male, Female |
| 🌍 **Languages** | English (US), English (UK), Thai, Japanese, Korean, Spanish, French, German, Italian, Hindi |
| 🎭 **Emotions** | Neutral, Calm & Soothing, Energetic, Formal, Dramatic, Mysterious |
| 🎚️ **Fine-tuning** | Adjustable speed and pitch |

### 🎵 More
- 🎧 **Voice Tracks** — showcase page with playable demo tracks and Web Audio API synth effects
- 💾 **Save requests** — Voice Lab submissions are stored in MySQL through a PHP endpoint
- 🛠️ **Admin panel** — view, filter, paginate and delete saved requests, with summary stats
- 🌌 **Futuristic UI** — Orbitron & Outfit fonts with a fully responsive layout

---

## 📄 Pages

| File | Page | Description |
| --- | --- | --- |
| 🏠 `index.html` | Studio | Home page and introduction |
| 🎧 `services.html` | Tracks | Voice tracks showcase |
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
