'use client';

import { motion } from 'framer-motion';
import type { Message } from 'ai';
import ProductCarousel from '@/components/products/ProductCarousel';
import ProductSkeleton from '@/components/products/ProductSkeleton';
import PayLinkCard from '@/components/checkout/PayLinkCard';
import TrackOrderCard from '@/components/checkout/TrackOrderCard';
import type { Product } from '@/components/products/ProductCard';
import { extractProducts, extractOrder, extractTracking } from '@/lib/mcp-parse';

const isProductTool = (name: string) =>
  name === 'kapruka_search_products' || name === 'kapruka_get_product';

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const invocations = message.toolInvocations ?? [];

  // Merge products from EVERY product tool call in this message into one deduped
  // list → a single "Top matches" carousel (no repeated headers when the model
  // searches more than once).
  const products: Product[] = [];
  const seen = new Set<string>();
  for (const inv of invocations) {
    if (inv.state === 'result' && isProductTool(inv.toolName)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of extractProducts((inv as any).result)) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          products.push(p);
        }
      }
    }
  }
  const productLoading = invocations.some(
    (inv) => inv.state !== 'result' && isProductTool(inv.toolName)
  );

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
      </div>

      {/* Product rail — full chat-column width so cards aren't clipped and the
          row scrolls horizontally (slim scrollbar shows below it). */}
      {productLoading && products.length === 0 && (
        <div className="w-full mt-2">
          <ProductSkeleton />
        </div>
      )}
      {products.length > 0 && (
        <div className="w-full mt-2">
          <ProductCarousel products={products} label="Top matches" />
        </div>
      )}

      {/* Order / tracking cards (categories & delivery render as AI text) */}
      {invocations.map((invocation) => {
          if (invocation.state !== 'result') return null;
          const { toolName } = invocation;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = (invocation as any).result;

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

          if (toolName === 'kapruka_track_order') {
            return (
              <TrackOrderCard
                key={invocation.toolCallId}
                tracking={extractTracking(result)}
              />
            );
          }

          return null;
        })}
    </motion.div>
  );
}

export type { Product };
