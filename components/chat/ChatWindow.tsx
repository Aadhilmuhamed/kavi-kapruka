'use client';

import { useEffect, useRef } from 'react';
import type { Message } from 'ai';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow({
  messages,
  isLoading,
}: {
  messages: Message[];
  isLoading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Show the typing indicator only while waiting for the first chunk of the
  // assistant's reply (no streamed assistant message yet).
  const last = messages[messages.length - 1];
  const showTyping = isLoading && (!last || last.role === 'user');

  return (
    <div className="h-full overflow-y-auto px-margin-mobile md:px-[12%] py-6 space-y-8">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {showTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
