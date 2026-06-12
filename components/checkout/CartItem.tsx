'use client';

import { useCartStore, type CartItem as CartItemType } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

export default function CartItem({ item }: { item: CartItemType }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-3 items-center">
      <div className="w-12 h-12 rounded-lg bg-bg-surface overflow-hidden flex-shrink-0">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-cream text-xs font-medium truncate">{item.name}</p>
        <p className="text-accent text-xs">{formatPrice(item.price, item.currency)}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="w-6 h-6 rounded bg-bg-hover text-cream text-sm flex items-center justify-center hover:bg-border"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="text-cream text-xs w-5 text-center">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="w-6 h-6 rounded bg-bg-hover text-cream text-sm flex items-center justify-center hover:bg-border"
          aria-label="Increase quantity"
        >
          +
        </button>
        <button
          onClick={() => removeItem(item.id)}
          className="ml-1 w-6 h-6 rounded text-muted text-sm flex items-center justify-center hover:text-accent"
          aria-label="Remove item"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
