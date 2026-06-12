'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cart';

interface Props {
  onSend: (text: string) => void;
  onAdvisor: () => void;
}

export default function QuickActions({ onSend, onAdvisor }: Props) {
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.openCart);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasCart = mounted && totalItems > 0;

  return (
    <div className="flex gap-2.5 overflow-x-auto hide-scrollbar px-margin-mobile md:px-margin-desktop pt-2 pb-1 max-w-3xl mx-auto w-full">
      <button
        onClick={onAdvisor}
        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary-fixed/40 border border-secondary-fixed-dim/50 text-on-secondary-container text-xs font-label-caps uppercase tracking-wide hover:bg-secondary-fixed/70 transition-all active:scale-95 whitespace-nowrap shadow-sm"
      >
        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
        Gift Advisor
      </button>
      {hasCart && (
        <button
          onClick={openCart}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-outline-variant/40 text-primary text-xs font-label-caps uppercase tracking-wide hover:border-primary hover:bg-primary-fixed/20 transition-all active:scale-95 whitespace-nowrap shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
          Checkout ({totalItems})
        </button>
      )}
      <button
        onClick={() => onSend('Show me your product categories')}
        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-outline-variant/40 text-primary text-xs font-label-caps uppercase tracking-wide hover:border-primary hover:bg-primary-fixed/20 transition-all active:scale-95 whitespace-nowrap shadow-sm"
      >
        <span className="material-symbols-outlined text-[16px]">category</span>
        Categories
      </button>
      <button
        onClick={() => onSend('I want to track my order')}
        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-outline-variant/40 text-primary text-xs font-label-caps uppercase tracking-wide hover:border-primary hover:bg-primary-fixed/20 transition-all active:scale-95 whitespace-nowrap shadow-sm"
      >
        <span className="material-symbols-outlined text-[16px]">package_2</span>
        Track order
      </button>
    </div>
  );
}
