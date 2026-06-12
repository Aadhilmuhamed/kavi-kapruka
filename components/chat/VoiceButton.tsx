'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  createRecognition,
  isSpeechRecognitionSupported,
  type RecognitionLike,
} from '@/lib/speech';

interface Props {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceButton({ onInterim, onFinal, disabled }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
    return () => recRef.current?.abort();
  }, []);

  if (!supported) return null;

  const start = () => {
    const rec = createRecognition('en-US');
    if (!rec) return;
    recRef.current = rec;

    rec.onresult = (e: {
      resultIndex: number;
      results: { [k: number]: { 0: { transcript: string }; isFinal: boolean }; length: number };
    }) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const t = res[0].transcript;
        if (res.isFinal) final += t;
        else interim += t;
      }
      if (interim) onInterim(interim);
      if (final.trim()) onFinal(final.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const stop = () => {
    recRef.current?.stop();
    setListening(false);
  };

  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      disabled={disabled}
      aria-label={listening ? 'Stop voice input' : 'Start voice input'}
      title={listening ? 'Listening… tap to stop' : 'Speak to Kavi'}
      className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed ${
        listening
          ? 'bg-primary text-white'
          : 'text-primary hover:bg-primary-fixed/40'
      }`}
    >
      {listening && (
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/40"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
      <span className="material-symbols-outlined relative text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        mic
      </span>
    </button>
  );
}
