'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import CartItem from './CartItem';
import CheckoutFlow from './CheckoutFlow';

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const step = useCartStore((s) => s.step);
  const setStep = useCartStore((s) => s.setStep);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-[100dvh] w-full sm:w-96 bg-bg-card border-l border-border z-50 flex flex-col shadow-pop"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <h2 className="font-display text-lg text-cream">Your Cart</h2>
              <button
                onClick={closeCart}
                className="text-muted hover:text-cream transition-colors text-xl w-8 h-8 flex items-center justify-center"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted text-sm">Your cart is empty 🛒</p>
              </div>
            ) : step === 'idle' ? (
              <>
                {/* Cart items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-muted text-sm">Total</span>
                    <span className="text-cream font-semibold">
                      {formatPrice(totalPrice())}
                    </span>
                  </div>
                  <button
                    onClick={() => setStep('city')}
                    className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-sm transition-colors"
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              </>
            ) : (
              <CheckoutFlow />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
