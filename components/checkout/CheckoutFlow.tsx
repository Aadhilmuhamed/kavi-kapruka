'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

export default function CheckoutFlow() {
  const step = useCartStore((s) => s.step);
  const delivery = useCartStore((s) => s.delivery);
  const setDelivery = useCartStore((s) => s.setDelivery);
  const setStep = useCartStore((s) => s.setStep);
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const resetCheckout = useCartStore((s) => s.resetCheckout);
  const closeCart = useCartStore((s) => s.closeCart);

  const [loading, setLoading] = useState(false);
  const [error] = useState('');

  // Tomorrow as the earliest delivery date.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (step === 'done') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <p className="font-display text-xl text-cream mb-2">ස්තූතියි!</p>
        <p className="text-muted text-sm mb-6">
          Your order details are ready. Ask Kavi in the chat to finalise payment and
          get your secure pay link.
        </p>
        <button
          onClick={() => {
            clearCart();
            resetCheckout();
            closeCart();
          }}
          className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  const handleConfirm = async () => {
    setLoading(true);
    // The AI agent finalises kapruka_create_order via MCP from the chat.
    // This UI flow collects + summarises the delivery details for the user.
    await new Promise((r) => setTimeout(r, 400));
    setLoading(false);
    setStep('done');
  };

  const stepIndex = ['city', 'date', 'recipient', 'gift', 'confirm'].indexOf(step) + 1;

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <p className="text-muted text-xs">Step {stepIndex} of 5</p>
        <button
          onClick={() => setStep('idle')}
          className="text-muted text-xs hover:text-cream transition-colors"
        >
          ← Back to cart
        </button>
      </div>

      {step === 'city' && (
        <>
          <h3 className="text-cream font-medium">Delivery City</h3>
          <input
            type="text"
            placeholder="e.g. Colombo, Kandy..."
            value={delivery.city}
            onChange={(e) => setDelivery({ city: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-bg-surface border border-border text-cream text-sm focus:outline-none focus:border-accent/50"
          />
          <button
            disabled={!delivery.city.trim()}
            onClick={() => setStep('date')}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            Continue →
          </button>
        </>
      )}

      {step === 'date' && (
        <>
          <h3 className="text-cream font-medium">Delivery Date</h3>
          <input
            type="date"
            min={minDate}
            value={delivery.deliveryDate}
            onChange={(e) => setDelivery({ deliveryDate: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-bg-surface border border-border text-cream text-sm focus:outline-none focus:border-accent/50"
          />
          <button
            disabled={!delivery.deliveryDate}
            onClick={() => setStep('recipient')}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            Continue →
          </button>
        </>
      )}

      {step === 'recipient' && (
        <>
          <h3 className="text-cream font-medium">Recipient Details</h3>
          <input
            type="text"
            placeholder="Recipient name"
            value={delivery.recipientName}
            onChange={(e) => setDelivery({ recipientName: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-bg-surface border border-border text-cream text-sm focus:outline-none focus:border-accent/50"
          />
          <input
            type="tel"
            placeholder="+94XXXXXXXXX"
            value={delivery.recipientPhone}
            onChange={(e) => setDelivery({ recipientPhone: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-bg-surface border border-border text-cream text-sm focus:outline-none focus:border-accent/50"
          />
          <button
            disabled={!delivery.recipientName.trim() || !delivery.recipientPhone.trim()}
            onClick={() => setStep('gift')}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            Continue →
          </button>
        </>
      )}

      {step === 'gift' && (
        <>
          <h3 className="text-cream font-medium">
            Gift Message <span className="text-muted font-normal">(optional)</span>
          </h3>
          <textarea
            placeholder="Write a heartfelt message..."
            value={delivery.giftMessage}
            onChange={(e) => setDelivery({ giftMessage: e.target.value })}
            maxLength={200}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-bg-surface border border-border text-cream text-sm resize-none focus:outline-none focus:border-accent/50"
          />
          <button
            onClick={() => setStep('confirm')}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            {delivery.giftMessage.trim() ? 'Add Message & Continue' : 'Skip →'}
          </button>
        </>
      )}

      {step === 'confirm' && (
        <>
          <h3 className="text-cream font-medium">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Items</span>
              <span className="text-cream">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">City</span>
              <span className="text-cream">{delivery.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Date</span>
              <span className="text-cream">{delivery.deliveryDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Recipient</span>
              <span className="text-cream">{delivery.recipientName}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border pt-2 mt-2">
              <span className="text-muted">Subtotal</span>
              <span className="text-accent">{formatPrice(totalPrice())}</span>
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <p className="text-muted text-xs">
            ℹ️ Ask Kavi in the chat to finalize your order and get the payment link, or
            confirm here to proceed.
          </p>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {loading ? 'Creating order...' : 'Confirm Order →'}
          </button>
        </>
      )}
    </div>
  );
}
