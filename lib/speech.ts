/**
 * Browser-native voice helpers (Web Speech API). No API key, no cost.
 * - Speech-to-text: SpeechRecognition (Chrome / Edge / mobile Chrome).
 * - Text-to-speech: speechSynthesis (all evergreen browsers).
 * Everything degrades silently when unsupported.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
  onstart: (() => void) | null;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

export function createRecognition(lang = 'en-US'): RecognitionLike | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec: RecognitionLike = new Ctor();
  rec.lang = lang;
  rec.continuous = false;
  rec.interimResults = true;
  return rec;
}

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Strip emojis, markdown and tidy whitespace so TTS reads cleanly. */
export function stripForSpeech(text: string): string {
  return text
    .replace(/[*_`#>~]/g, '') // markdown tokens
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links → label
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]/gu,
      ''
    ) // emoji + symbols
    .replace(/\s+/g, ' ')
    .trim();
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  // Prefer a Sinhala voice, then any English, else default.
  return (
    voices.find((v) => /si(-|_)?LK/i.test(v.lang)) ||
    voices.find((v) => /^en(-|_)?(LK|IN|GB)/i.test(v.lang)) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0]
  );
}

export function speak(text: string) {
  if (!isTTSSupported()) return;
  const clean = stripForSpeech(text);
  if (!clean) return;
  // Cancel anything already speaking so replies don't overlap.
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = 1.02;
  u.pitch = 1.0;
  currentUtterance = u;
  window.speechSynthesis.speak(u);
}

export function cancelSpeak() {
  if (!isTTSSupported()) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

/** Some browsers populate voices lazily; warm them up once. */
export function warmUpVoices() {
  if (!isTTSSupported()) return;
  window.speechSynthesis.getVoices();
}
