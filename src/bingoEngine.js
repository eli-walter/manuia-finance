// src/bingoEngine.js
// Open-source Bingo Number Calling Engine
// Implements standard 75-ball bingo (North American format).
//
// References:
//   • Standard B-I-N-G-O rules: https://en.wikipedia.org/wiki/Bingo_(American_version)
//   • Web Speech API (voice): https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
//   • Cryptographic RNG: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
//
// Column mapping:
//   B = 1–15  |  I = 16–30  |  N = 31–45  |  G = 46–60  |  O = 61–75

// ── Column definitions ──────────────────────────────────────────────────────
export const COLUMNS = {
  B: { range: [1,  15], color: '#1565C0', dim: '#E3F2FD' },
  I: { range: [16, 30], color: '#B87000', dim: '#FFF8E1' },
  N: { range: [31, 45], color: '#2E7D32', dim: '#E8F5E9' },
  G: { range: [46, 60], color: '#7B1FA2', dim: '#F3E5F5' },
  O: { range: [61, 75], color: '#C62828', dim: '#FFEBEE' },
};

// ── Derive the letter for any number 1–75 ──────────────────────────────────
export const letterFor = (n) =>
  n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O';

// ── Cryptographically secure random pick from an array ─────────────────────
export const securePick = (arr) => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return arr[buf[0] % arr.length];
};

// ── Draw the next ball from the remaining pool ─────────────────────────────
export const drawBall = (calledSet) => {
  const pool = Array.from({ length: 75 }, (_, i) => i + 1)
    .filter((n) => !calledSet.has(n));
  if (pool.length === 0) return null;
  const number = securePick(pool);
  const letter = letterFor(number);
  return { number, letter };
};

// ── Text-to-speech caller ──────────────────────────────────────────────────
// Pre-warm the TTS engine on module load so the first call has zero delay.
let _voices = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const load = () => { _voices = window.speechSynthesis.getVoices(); };
  load();
  window.speechSynthesis.addEventListener('voiceschanged', load);
}

export const announce = (letter, number, { rate = 0.82, pitch = 1.05 } = {}) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const preferred = _voices.find((v) => v.lang === 'en-US')
    || _voices.find((v) => v.lang.startsWith('en'));

  const say = (text, r = rate) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate  = r;
    u.pitch = pitch;
    u.volume = 1.0;
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  };

  say(letter, 0.70);      // letter — spoken slowly for clarity
  say(String(number));    // number follows with natural queue pause
};

export const cancelAnnounce = () => window.speechSynthesis?.cancel();
