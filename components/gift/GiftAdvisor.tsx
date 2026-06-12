'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Choice {
  label: string;
  emoji: string;
  value: string;
}

const WHO: Choice[] = [
  { emoji: '👩‍🦳', label: 'Parent', value: 'my parent' },
  { emoji: '💕', label: 'Partner', value: 'my partner' },
  { emoji: '🧑‍🤝‍🧑', label: 'Friend', value: 'my friend' },
  { emoji: '💼', label: 'Colleague', value: 'my colleague' },
  { emoji: '🧒', label: 'Child', value: 'a child' },
  { emoji: '🪞', label: 'Myself', value: 'myself' },
];

const BUDGET: Choice[] = [
  { emoji: '🪙', label: 'Under 1,000', value: 'under LKR 1,000 (max_price 1000)' },
  { emoji: '💵', label: '1,000–3,000', value: 'LKR 1,000 to 3,000 (min_price 1000, max_price 3000)' },
  { emoji: '💳', label: '3,000–7,000', value: 'LKR 3,000 to 7,000 (min_price 3000, max_price 7000)' },
  { emoji: '💎', label: '7,000+', value: 'above LKR 7,000 (min_price 7000)' },
];

const OCCASION: Choice[] = [
  { emoji: '🎂', label: 'Birthday', value: 'a birthday' },
  { emoji: '💝', label: 'Anniversary', value: 'an anniversary' },
  { emoji: '🪔', label: 'Vesak', value: 'Vesak' },
  { emoji: '🎊', label: 'New Year', value: 'Sinhala & Tamil New Year' },
  { emoji: '✨', label: 'Just because', value: 'just because' },
];

const STEPS = [
  { key: 'who', title: "Who's it for?", choices: WHO },
  { key: 'budget', title: "What's your budget?", choices: BUDGET },
  { key: 'occasion', title: "What's the occasion?", choices: OCCASION },
] as const;

export default function GiftAdvisor({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const reset = () => {
    setStepIdx(0);
    setAnswers({});
  };

  const handlePick = (value: string) => {
    const key = STEPS[stepIdx].key;
    const next = { ...answers, [key]: value };
    setAnswers(next);

    if (stepIdx < STEPS.length - 1) {
      setStepIdx(stepIdx + 1);
    } else {
      const prompt = `🎁 Gift Advisor — find me the perfect gift for ${next.who}, for ${next.occasion}, with a budget ${next.budget}. Search Kapruka, show 3 great options sorted by price, and recommend the single best one with a short reason.`;
      onSubmit(prompt);
      onClose();
      reset();
    }
  };

  const step = STEPS[stepIdx];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              onClose();
              reset();
            }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-bg-card border border-border rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-pop"
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎁</span>
                    <h2 className="font-display text-xl text-cream">Gift Advisor</h2>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      reset();
                    }}
                    className="text-muted hover:text-cream w-8 h-8 flex items-center justify-center text-lg"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                {/* Progress */}
                <div className="flex gap-1.5 mt-3">
                  {STEPS.map((s, i) => (
                    <div
                      key={s.key}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= stepIdx
                          ? 'bg-gradient-to-r from-accent to-purple'
                          : 'bg-bg-hover'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-muted text-xs mb-1">
                      Step {stepIdx + 1} of {STEPS.length}
                    </p>
                    <h3 className="font-display text-lg text-cream mb-4">{step.title}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {step.choices.map((c, i) => (
                        <motion.button
                          key={c.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => handlePick(c.value)}
                          className="flex items-center gap-2 px-3 py-3 rounded-xl bg-bg-surface border border-border text-sm text-cream/90 hover:border-accent/50 hover:bg-accent/10 transition-all text-left"
                        >
                          <span className="text-lg">{c.emoji}</span>
                          <span>{c.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {stepIdx > 0 && (
                  <button
                    onClick={() => setStepIdx(stepIdx - 1)}
                    className="mt-4 text-muted text-xs hover:text-cream transition-colors"
                  >
                    ← Back
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
