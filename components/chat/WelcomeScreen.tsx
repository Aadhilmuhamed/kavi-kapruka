'use client';

import { motion } from 'framer-motion';

const SUGGESTIONS = [
  { emoji: '🎂', label: 'Birthday cake delivery', prompt: 'I want to order a birthday cake' },
  { emoji: '💐', label: 'Send flowers', prompt: 'I want to send flowers' },
  { emoji: '🍫', label: 'Chocolates', prompt: 'Show me chocolate gift boxes' },
  { emoji: '🛍️', label: 'Browse categories', prompt: 'Show me your product categories' },
  { emoji: '📦', label: 'Track my order', prompt: 'I want to track my order' },
  { emoji: '💝', label: 'Anniversary gift', prompt: 'Help me find an anniversary gift' },
];

export default function WelcomeScreen({
  onSuggestion,
  onGiftAdvisor,
}: {
  onSuggestion: (text: string) => void;
  onGiftAdvisor: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto flex flex-col items-center justify-center px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg w-full"
      >
        {/* Avatar */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-secondary-fixed-dim/30 blur-xl" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-5xl font-display text-white shadow-pop ring-4 ring-white">
            ක
          </div>
        </div>

        {/* Greeting */}
        <p className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant/70 font-semibold mb-3">
          Kapruka Luxe • AI Concierge
        </p>
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-3">
          ආයුබෝවන්! I&apos;m Kavi
        </h1>
        <p className="text-on-surface-variant text-body-lg mb-8 leading-relaxed">
          Your personal shopping concierge for Kapruka.com — Sri Lanka&apos;s largest store.
          Curated gifts, effortless checkout, delivered with care.
        </p>

        {/* Gift Advisor hero CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={onGiftAdvisor}
          className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-primary text-on-primary font-label-caps text-sm uppercase tracking-wide hover:bg-primary-container gold-glow transition-all active:scale-[0.99] shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          Find the perfect gift — Gift Advisor
        </motion.button>

        {/* Suggestion chips */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              onClick={() => onSuggestion(s.prompt)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-outline-variant/40 text-sm text-on-surface hover:border-primary hover:bg-primary-fixed/20 hover:text-primary transition-all text-left shadow-sm active:scale-95"
            >
              <span className="text-lg">{s.emoji}</span>
              <span className="font-medium">{s.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
