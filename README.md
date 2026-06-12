# 🎱 Manuia Finance

Bingo group finance manager — React + Capacitor (Android) + Electron (Desktop) + Firebase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + Lucide Icons |
| Mobile (Android) | Capacitor 5 |
| Desktop | Electron 30 |
| Cloud sync | Firebase Firestore (optional) |
| Offline storage | localStorage / IndexedDB |
| Bingo caller engine | `src/bingoEngine.js` (Web Crypto API + Web Speech API) |
| CI/CD | GitHub Actions |

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/manuia-finance.git
cd manuia-finance
npm install
npm start          # opens at http://localhost:3000
```

### Run as Desktop app (Electron)

```bash
npm run electron:dev        # dev mode (hot reload)
npm run electron:build      # build distributable for your OS
```

### Build Android APK (Capacitor)

```bash
npm run build               # build React first
npm run cap:add             # add Android platform (first time only)
npm run cap:icons           # generate icons from assets/icon.png
npm run cap:build           # sync to Android
# Then open Android Studio:
npm run cap:open
```

---

## Firebase Setup (Optional)

The app runs fully offline without Firebase. To enable cloud sync:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add a **Web app** to the project
3. Copy your config values into `.env`:

```bash
cp .env.example .env
# Edit .env with your Firebase values
```

4. In Firestore, create a database in **production mode** and add this security rule:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /manuia/{docId}/{collection}/{item} {
      allow read, write: if request.auth == null;  // open for now — add auth later
    }
  }
}
```

### GitHub Secrets (for CI builds with Firebase)

Go to your repo → **Settings → Secrets → Actions** and add:

| Secret name | Value |
|---|---|
| `FIREBASE_API_KEY` | from Firebase config |
| `FIREBASE_AUTH_DOMAIN` | from Firebase config |
| `FIREBASE_PROJECT_ID` | from Firebase config |
| `FIREBASE_STORAGE_BUCKET` | from Firebase config |
| `FIREBASE_MESSAGING_SENDER_ID` | from Firebase config |
| `FIREBASE_APP_ID` | from Firebase config |

If these secrets are not set, the build still succeeds — the app just uses localStorage only.

---

## Bingo Caller Engine

The caller is implemented in `src/bingoEngine.js` and uses:

- **[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)** — `crypto.getRandomValues()` for cryptographically secure ball draws (no `Math.random()`)
- **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)** — built-in device TTS, pre-warmed on app load for zero-delay calling
- Standard **75-ball B-I-N-G-O** format (B=1–15, I=16–30, N=31–45, G=46–60, O=61–75)

Both APIs are open-source browser standards — no external packages or internet required for calling.

---

## CI/CD — GitHub Actions

Go to **Actions → Build — Manuia Finance → Run workflow** and choose a target:

| Target | Output |
|---|---|
| `android` | `manuia-finance.apk` (debug) |
| `electron` | `.exe` (Windows) + `.dmg` (macOS) + `.AppImage` (Linux) |
| `all` | All of the above |

All artifacts are downloadable from the Actions run page for 30 days.

---

## Project Structure

```
manuia-finance/
├── .github/workflows/build.yml   CI/CD — all platforms
├── assets/icon.png               Source icon (1254×1254)
├── electron/
│   ├── main.js                   Electron main process
│   └── preload.js                Context bridge
├── public/index.html             HTML shell
├── src/
│   ├── App.jsx                   Main React app (~1100 lines)
│   ├── firebase.js               Firebase connection layer
│   ├── bingoEngine.js            Open-source bingo caller engine
│   ├── index.js                  React entry
│   └── index.css                 Base styles
├── capacitor.config.json
├── electron-builder.json
├── package.json
└── .env.example                  Firebase config template
```
