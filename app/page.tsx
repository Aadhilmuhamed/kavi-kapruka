'use client';

import { useChat } from 'ai/react';
import type { Message } from 'ai';
import { useEffect, useRef, useState } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInput from '@/components/chat/ChatInput';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import QuickActions from '@/components/chat/QuickActions';
import CartDrawer from '@/components/checkout/CartDrawer';
import GiftAdvisor from '@/components/gift/GiftAdvisor';
import { useCartStore } from '@/store/cart';
import { speak, cancelSpeak, warmUpVoices } from '@/lib/speech';

export default function Home() {
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const voiceOutRef = useRef(false);

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, append, setMessages } =
    useChat({
      api: '/api/chat',
      onFinish: (message: Message) => {
        // Speak Kavi's reply aloud when voice output is on.
        if (voiceOutRef.current && message.role === 'assistant' && message.content) {
          speak(message.content);
        }
      },
    });

  const hasMessages = messages.length > 0;

  useEffect(() => {
    warmUpVoices();
  }, []);

  useEffect(() => {
    voiceOutRef.current = voiceOut;
    if (!voiceOut) cancelSpeak();
  }, [voiceOut]);

  const handleSuggestion = (text: string) => {
    append({ role: 'user', content: text });
  };

  // Live transcript fills the input box; a final phrase auto-sends.
  const handleVoiceInterim = (text: string) => setInput(text);
  const handleVoiceFinal = (text: string) => {
    setInput('');
    if (!isLoading) append({ role: 'user', content: text });
  };

  return (
    <main className="flex h-[100dvh] w-screen overflow-hidden bg-surface text-on-surface">
      {/* Chat area */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        {/* Top nav — Kapruka Luxe concierge */}
        <header className="flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 md:h-20 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-xl z-20 shadow-sm shadow-primary/5">
          <div className="flex items-center gap-4 md:gap-8 min-w-0">
            <button
              onClick={() => setMessages([])}
              title="Kavi — new conversation"
              className="flex items-center gap-2.5 shrink-0"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-base font-display text-white shadow-lg shadow-primary/20">
                ක
              </div>
              <span className="flex flex-col items-start leading-none">
                <span className="font-display-lg text-headline-md font-bold tracking-tight text-primary">
                  Kavi
                </span>
                <span className="hidden sm:block text-[9px] uppercase tracking-[0.18em] text-on-surface-variant/70 font-semibold mt-0.5">
                  Kapruka Concierge
                </span>
              </span>
            </button>
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setMessages([])}
                className="text-primary font-bold font-label-caps text-label-caps uppercase hover:opacity-80 transition-opacity"
              >
                Concierge
              </button>
              <button
                onClick={() => handleSuggestion('Show me your product categories')}
                className="text-on-surface-variant font-label-caps text-label-caps uppercase hover:text-primary transition-colors"
              >
                Collections
              </button>
              <button
                onClick={() => handleSuggestion('I want to track my order')}
                className="text-on-surface-variant font-label-caps text-label-caps uppercase hover:text-primary transition-colors"
              >
                Orders
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <SpeakerToggle on={voiceOut} onToggle={() => setVoiceOut((v) => !v)} />
            <CartButton />
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-primary-fixed items-center justify-center text-primary border border-outline-variant/30">
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
            </div>
          </div>
        </header>

        {/* Messages or Welcome */}
        <div className="flex-1 overflow-hidden relative">
          {!hasMessages ? (
            <WelcomeScreen
              onSuggestion={handleSuggestion}
              onGiftAdvisor={() => setAdvisorOpen(true)}
            />
          ) : (
            <ChatWindow messages={messages} isLoading={isLoading} />
          )}
        </div>

        {/* Quick actions + Input */}
        {hasMessages && (
          <QuickActions onSend={handleSuggestion} onAdvisor={() => setAdvisorOpen(true)} />
        )}
        <ChatInput
          input={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onVoiceInterim={handleVoiceInterim}
          onVoiceFinal={handleVoiceFinal}
        />
      </div>

      {/* Cart drawer */}
      <CartDrawer />

      {/* Gift Advisor guided flow */}
      <GiftAdvisor
        open={advisorOpen}
        onClose={() => setAdvisorOpen(false)}
        onSubmit={handleSuggestion}
      />
    </main>
  );
}

function SpeakerToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  // speechSynthesis is the only hard requirement for voice output.
  if (!mounted || typeof window === 'undefined' || !('speechSynthesis' in window))
    return null;
  return (
    <button
      onClick={onToggle}
      aria-label={on ? 'Turn off Kavi voice' : 'Turn on Kavi voice'}
      title={on ? "Kavi's voice is on" : "Hear Kavi speak"}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 border ${
        on
          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
          : 'bg-white text-on-surface-variant border-outline-variant/40 hover:text-primary hover:border-primary/50'
      }`}
    >
      {on ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.787L4.5 13H3a1 1 0 01-1-1V8a1 1 0 011-1h1.5l3.883-3.787a1 1 0 011-.137zM13.293 6.293a1 1 0 011.414 0A5.98 5.98 0 0116 10a5.98 5.98 0 01-1.293 3.707 1 1 0 01-1.414-1.414A3.98 3.98 0 0014 10a3.98 3.98 0 00-.707-2.293 1 1 0 010-1.414z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.787L4.5 13H3a1 1 0 01-1-1V8a1 1 0 011-1h1.5l3.883-3.787a1 1 0 011-.137zM13.293 7.293a1 1 0 011.414 0L16 8.586l1.293-1.293a1 1 0 111.414 1.414L17.414 10l1.293 1.293a1 1 0 01-1.414 1.414L16 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L14.586 10l-1.293-1.293a1 1 0 010-1.414z" />
        </svg>
      )}
    </button>
  );
}

function CartButton() {
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.openCart);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || totalItems === 0) return null;
  return (
    <button
      onClick={openCart}
      aria-label="Open cart"
      className="relative w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-container transition-all active:scale-95 shadow-lg shadow-primary/20"
    >
      <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-secondary-fixed-dim text-on-secondary-fixed text-[11px] font-bold flex items-center justify-center border-2 border-surface">
        {totalItems}
      </span>
    </button>
  );
}
