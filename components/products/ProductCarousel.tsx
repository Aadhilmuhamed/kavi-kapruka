'use client';

import ProductCard, { type Product } from './ProductCard';

export default function ProductCarousel({
  products,
  label = 'Top matches',
}: {
  products: Product[];
  label?: string;
}) {
  if (!products || products.length === 0) {
    return (
      <div className="text-on-surface-variant text-sm px-4 py-3 bg-white border border-outline-variant/30 rounded-2xl">
        No matches just yet — shall I try a different search? 🔎
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-4">
        <div className="h-px flex-grow bg-outline-variant/40" />
        <h4 className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] whitespace-nowrap">
          {label}
        </h4>
        <div className="h-px flex-grow bg-outline-variant/40" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
        {products.map((product, i) => (
          <div key={`${product.id}-${i}`} className="snap-start">
            <ProductCard product={product} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
