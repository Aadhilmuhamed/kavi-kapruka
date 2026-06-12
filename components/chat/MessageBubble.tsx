'use client';

import { motion } from 'framer-motion';
import type { Message } from 'ai';
import ProductCarousel from '@/components/products/ProductCarousel';
import ProductSkeleton from '@/components/products/ProductSkeleton';
import PayLinkCard from '@/components/checkout/PayLinkCard';
import TrackOrderCard from '@/components/checkout/TrackOrderCard';
import type { Product } from '@/components/products/ProductCard';
import { extractProducts, extractOrder, extractTracking } from '@/lib/mcp-parse';

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div
        className={`w-full max-w-[88%] sm:max-w-[76%] ${
          isUser ? 'items-end' : 'items-start'
        } flex flex-col gap-2`}
      >
        {/* Concierge label — assistant only */}
        {!isUser && (
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-xs font-display text-white shrink-0">
              ක
            </div>
            <span className="text-[10px] text-on-surface-variant/70 uppercase tracking-widest font-semibold">
              Kavi • AI Concierge
            </span>
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <div
            className={`px-5 py-4 text-body-md leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-primary text-on-primary rounded-2xl rounded-tr-none shadow-lg shadow-primary/10'
                : 'ai-bubble text-on-surface rounded-2xl rounded-tl-none'
            }`}
          >
            {message.content}
          </div>
        )}

        {/* Tool invocation results */}
        {message.toolInvocations?.map((invocation) => {
          // Loading state — only product-ish tools get a visual skeleton.
          if (invocation.state !== 'result') {
            const isProductTool =
              invocation.toolName === 'kapruka_search_products' ||
              invocation.toolName === 'kapruka_get_product';
            return isProductTool ? (
              <ProductSkeleton key={invocation.toolCallId} />
            ) : null;
          }

          const { toolName } = invocation;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = (invocation as any).result;

          // Product search results
          if (toolName === 'kapruka_search_products') {
            return (
              <ProductCarousel
                key={invocation.toolCallId}
                products={extractProducts(result)}
              />
            );
          }

          // Single product detail
          if (toolName === 'kapruka_get_product') {
            const products = extractProducts(result);
            return (
              <ProductCarousel key={invocation.toolCallId} products={products} />
            );
          }

          // Order created → pay link
          if (toolName === 'kapruka_create_order') {
            const order = extractOrder(result);
            return (
              <PayLinkCard
                key={invocation.toolCallId}
                payUrl={order.payUrl}
                orderNumber={order.orderNumber}
                total={order.total}
                currency={order.currency}
                expiresAt={order.expiresAt}
              />
            );
          }

          // Track order → status timeline card
          if (toolName === 'kapruka_track_order') {
            return (
              <TrackOrderCard
                key={invocation.toolCallId}
                tracking={extractTracking(result)}
              />
            );
          }

          // Other tools (categories, delivery cities) are rendered as AI text.
          return null;
        })}
      </div>
    </motion.div>
  );
}

export type { Product };
