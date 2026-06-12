'use client';

import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/utils';

interface Props {
  payUrl: string;
  orderNumber: string;
  total?: number;
  currency?: string;
  expiresAt?: string;
}

export default function PayLinkCard({
  payUrl,
  orderNumber,
  total,
  currency = 'LKR',
  expiresAt,
}: Props) {
  if (!payUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm rounded-2xl bg-bg-card border border-accent/30 overflow-hidden shadow-card"
    >
      {/* Header */}
      <div className="bg-accent/10 px-4 py-3 border-b border-accent/20">
        <p className="text-accent font-medium text-sm">🎉 Order Ready!</p>
        {orderNumber && (
          <p className="text-muted text-xs mt-0.5">Order #{orderNumber}</p>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {total !== undefined && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted text-sm">Total</span>
            <span className="text-cream font-semibold">
              {formatPrice(total, currency)}
            </span>
          </div>
        )}
        <a
          href={payUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-center font-medium text-sm transition-colors"
        >
          Pay Now →
        </a>
        {expiresAt && (
          <p className="text-muted text-xs text-center mt-2">
            ⏱ Link valid for 60 minutes
          </p>
        )}
      </div>
    </motion.div>
  );
}
