'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  imageUrl?: string;
  currency?: string;
  in_stock?: boolean;
  url?: string;
}

export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const imageUrl = product.image || product.imageUrl || '';
  const inStock = product.in_stock !== false;
  const price =
    typeof product.price === 'number'
      ? product.price
      : parseFloat(product.price as unknown as string) || 0;

  const handleAdd = () => {
    if (!inStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price,
      image: imageUrl,
      currency: product.currency || 'LKR',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: index * 0.06 }}
      className="w-52 sm:w-56 flex-shrink-0 rounded-3xl bg-white border border-outline-variant/30 overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
    >
      {/* Product image */}
      <div className="relative aspect-square m-3 mb-0 rounded-2xl bg-surface-container-low overflow-hidden">
        {imageUrl && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-on-surface-variant/40">
            🛍️
          </div>
        )}
        {index === 0 && inStock && (
          <div className="absolute top-3 left-3 bg-secondary-fixed-dim text-on-secondary-fixed font-label-caps text-[10px] px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
            Luxe Pick
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs text-on-surface-variant font-semibold px-3 py-1 bg-white rounded-full shadow-sm">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-4 pt-3 flex flex-col gap-2">
        <p className="text-on-surface text-sm font-bold leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </p>
        <span className="text-primary font-bold text-body-md">
          {formatPrice(price, product.currency || 'LKR')}
        </span>
        <div className="mt-1 flex items-center gap-2">
          <button
            onClick={handleAdd}
            disabled={!inStock || added}
            className="flex-1 py-2.5 rounded-xl text-xs font-label-caps uppercase tracking-wide transition-all active:scale-95
              bg-primary text-on-primary gold-glow
              hover:bg-primary-container
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-primary/10 disabled:text-primary"
          >
            {added ? '✓ Added' : inStock ? 'Add' : 'Sold out'}
          </button>
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              title="View on Kapruka.com"
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant/50 text-primary hover:border-primary hover:bg-primary-fixed/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
