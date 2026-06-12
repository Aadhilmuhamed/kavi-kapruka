'use client';

import type { FormEvent, ChangeEvent } from 'react';
import VoiceButton from './VoiceButton';

interface Props {
  input: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onVoiceInterim: (text: string) => void;
  onVoiceFinal: (text: string) => void;
}

export default function ChatInput({
  input,
  onChange,
  onSubmit,
  isLoading,
  onVoiceInterim,
  onVoiceFinal,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <div className="px-margin-mobile md:px-margin-desktop pb-5 pt-2 bg-gradient-to-t from-surface via-surface/90 to-transparent">
      <form
        onSubmit={onSubmit}
        className="glass-card rounded-[28px] p-2 flex items-end gap-1 max-w-3xl mx-auto shadow-2xl shadow-primary/10 focus-within:border-primary/30 focus-within:shadow-primary/15 transition-all"
      >
        <VoiceButton
          onInterim={onVoiceInterim}
          onFinal={onVoiceFinal}
          disabled={isLoading}
        />
        <textarea
          value={input}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask Kavi anything... ආයුබෝවන්!"
          rows={1}
          className="flex-1 resize-none bg-transparent border-none focus:outline-none focus:ring-0 px-2 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-body-md max-h-32 leading-relaxed"
          style={{ minHeight: '48px' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send"
          className="flex-shrink-0 w-12 h-12 rounded-full bg-primary hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-95 hover:rotate-12 shadow-lg shadow-primary/30"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[22px]">send</span>
          )}
        </button>
      </form>
    </div>
  );
}
