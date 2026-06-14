'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
  summary?: string;
  category?: string;
  stockLevel?: string;
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
  const [showInfo, setShowInfo] = useState(false);
  const [qty, setQty] = useState(1);

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

  const handleAddQty = () => {
    if (!inStock) return;
    for (let i = 0; i < qty; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price,
        image: imageUrl,
        currency: product.currency || 'LKR',
      });
    }
    setShowInfo(false);
    setQty(1);
  };

  return (
    <>
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
          <button
            onClick={() => setShowInfo(true)}
            title="Product details"
            aria-label="Product details"
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant/50 text-primary hover:border-primary hover:bg-primary-fixed/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">info</span>
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

    {/* Product details modal — Kapruka product-page style */}
    <AnimatePresence>
      {showInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowInfo(false)}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-6"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-pop max-h-[92vh] flex flex-col"
          >
            <button
              onClick={() => setShowInfo(false)}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-on-surface shadow-sm hover:bg-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="overflow-y-auto flex flex-col lg:flex-row">
              {/* Image panel */}
              <div className="lg:w-1/2 shrink-0 p-3 sm:p-4 bg-surface-container-low/40">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-low">
                  {imageUrl && !imgFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl text-on-surface-variant/40">🛍️</div>
                  )}
                  {index === 0 && inStock && (
                    <span className="absolute top-3 left-3 bg-secondary-fixed-dim text-on-secondary-fixed font-label-caps text-[10px] px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                      Luxe Pick
                    </span>
                  )}
                </div>
              </div>

              {/* Details panel */}
              <div className="lg:w-1/2 p-6 flex flex-col gap-4">
                {/* Breadcrumb */}
                <p className="text-[11px] text-on-surface-variant/70 truncate">
                  Home <span className="mx-1">/</span>
                  {product.category || 'Products'} <span className="mx-1">/</span>
                  <span className="text-on-surface-variant">{product.name}</span>
                </p>

                <div>
                  {product.category && (
                    <p className="font-label-caps text-label-caps text-primary uppercase mb-1">
                      {product.category}
                    </p>
                  )}
                  <h2 className="font-display-lg text-primary text-2xl leading-tight">
                    {product.name}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-2xl text-on-surface">
                    {formatPrice(price, product.currency || 'LKR')}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      inStock ? 'bg-green-100 text-green-700' : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {inStock ? 'check_circle' : 'cancel'}
                    </span>
                    {inStock ? product.stockLevel ? `${product.stockLevel} stock` : 'In stock' : 'Out of stock'}
                  </span>
                </div>

                {/* Delivery / trust tags */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: 'local_shipping', label: 'Delivery within 24h' },
                    { icon: 'public', label: 'Islandwide delivery' },
                    { icon: 'verified_user', label: 'Secure checkout' },
                  ].map((t) => (
                    <span
                      key={t.label}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant bg-surface-container-low border border-outline-variant/40 px-2.5 py-1.5 rounded-full"
                    >
                      <span className="material-symbols-outlined text-[15px] text-primary">{t.icon}</span>
                      {t.label}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-label-caps text-label-caps text-on-surface-variant/80 uppercase mb-1.5">
                    Details
                  </h3>
                  <p className="text-on-surface-variant text-body-md leading-relaxed max-h-32 overflow-y-auto">
                    {product.summary?.trim() ||
                      'A handpicked selection from Kapruka. Tap “View on Kapruka” for full specifications, photos and delivery options.'}
                  </p>
                </div>

                {/* Quantity + actions */}
                <div className="mt-auto pt-2 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-on-surface-variant">Quantity</span>
                    <div className="flex items-center border border-outline-variant/50 rounded-full overflow-hidden">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        disabled={!inStock}
                        aria-label="Decrease quantity"
                        className="w-9 h-9 flex items-center justify-center text-primary hover:bg-primary-fixed/20 disabled:opacity-40 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="w-9 text-center text-sm font-bold text-on-surface">{qty}</span>
                      <button
                        onClick={() => setQty((q) => q + 1)}
                        disabled={!inStock}
                        aria-label="Increase quantity"
                        className="w-9 h-9 flex items-center justify-center text-primary hover:bg-primary-fixed/20 disabled:opacity-40 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddQty}
                      disabled={!inStock}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-label-caps uppercase tracking-wide bg-primary text-on-primary gold-glow hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                      {inStock ? `Add to cart · ${formatPrice(price * qty, product.currency || 'LKR')}` : 'Out of stock'}
                    </button>
                    {product.url && (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on Kapruka.com"
                        className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl border border-outline-variant/50 text-primary hover:border-primary hover:bg-primary-fixed/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
