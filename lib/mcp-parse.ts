import type { Product } from '@/components/products/ProductCard';

/**
 * MCP tool results are unpredictable in shape. They may arrive as:
 *  - a plain object: { items: [...] } or { products: [...] }
 *  - a bare array: [...]
 *  - the MCP content envelope: { content: [{ type: 'text', text: '<json>' }] }
 *  - a JSON string
 * These helpers normalise all of those into the shapes the UI needs.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/** Unwrap MCP content envelopes / JSON strings into a plain JS value. */
export function unwrap(result: Any): Any {
  if (result == null) return result;

  // JSON string → parse
  if (typeof result === 'string') {
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }

  // MCP content envelope: { content: [{ type:'text', text:'...' }, ...] }
  if (Array.isArray(result?.content)) {
    const textPart = result.content.find(
      (c: Any) => c?.type === 'text' && typeof c.text === 'string'
    );
    if (textPart) {
      try {
        return JSON.parse(textPart.text);
      } catch {
        return textPart.text;
      }
    }
  }

  return result;
}

function findArray(obj: Any): Any[] {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === 'object') {
    const keys = ['items', 'products', 'results', 'data', 'list'];
    for (const k of keys) {
      if (Array.isArray(obj[k])) return obj[k];
    }
    // nested one level deep (e.g. { data: { items: [...] } })
    for (const k of keys) {
      if (obj[k] && typeof obj[k] === 'object') {
        const nested = findArray(obj[k]);
        if (nested.length) return nested;
      }
    }
  }
  return [];
}

function num(v: Any): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Kapruka prices arrive as { amount, currency } objects (or sometimes a bare number/string). */
function priceAmount(p: Any): number {
  const cands = [p.price, p.amount, p.salePrice, p.sale_price];
  for (const c of cands) {
    if (c == null) continue;
    if (typeof c === 'object') return num(c.amount ?? c.value ?? c.price);
    return num(c);
  }
  return 0;
}

function priceCurrency(p: Any): string {
  if (p.price && typeof p.price === 'object' && p.price.currency) return p.price.currency;
  return p.currency ?? 'LKR';
}

/** Pull the first usable image URL from the many shapes Kapruka uses. */
function imageOf(p: Any): string {
  const direct = p.image_url ?? p.imageUrl ?? p.image ?? p.thumbnail ?? p.img;
  if (typeof direct === 'string' && direct) return direct;
  const imgs = p.images ?? p.media;
  if (Array.isArray(imgs) && imgs.length) {
    const first = imgs[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object')
      return first.url ?? first.image_url ?? first.src ?? '';
  }
  return '';
}

/** Normalise an MCP product-search / product-detail result into Product[]. */
export function extractProducts(result: Any): Product[] {
  const data = unwrap(result);
  let arr = findArray(data);

  // get_product may return a single object rather than an array
  if (arr.length === 0 && data && typeof data === 'object' && (data.name || data.title)) {
    arr = [data];
  }

  const mapped = arr.map((p: Any, i: number) => {
    const catRaw = p.category ?? p.categoryName ?? p.category_name;
    const category =
      catRaw && typeof catRaw === 'object' ? catRaw.name ?? catRaw.title : catRaw;
    return {
      id: String(p.id ?? p.sku ?? p.productId ?? p.product_id ?? i),
      name: p.name ?? p.title ?? p.productName ?? 'Product',
      price: priceAmount(p),
      image: imageOf(p),
      currency: priceCurrency(p),
      in_stock: p.in_stock ?? p.inStock ?? p.available ?? true,
      url: p.url ?? p.link ?? '',
      summary: p.summary ?? p.description ?? p.desc ?? p.short_description ?? '',
      category: typeof category === 'string' ? category : undefined,
      stockLevel: p.stock_level ?? p.stockLevel ?? p.availability ?? undefined,
    };
  });

  // Kapruka search can return the same product id twice — dedupe so cards don't
  // collide on React keys or duplicate in the carousel.
  const seen = new Set<string>();
  return mapped.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export interface OrderResult {
  payUrl: string;
  orderNumber: string;
  total?: number;
  currency: string;
  expiresAt: string;
}

/** Normalise an MCP create-order result into pay-link fields. */
export function extractOrder(result: Any): OrderResult {
  const d = unwrap(result) ?? {};
  const o = d.order ?? d; // some servers nest under `order`
  const totalRaw =
    o.total ?? o.amount ?? o.grandTotal ?? o.grand_total ?? o.total_amount;
  const total =
    totalRaw && typeof totalRaw === 'object'
      ? num(totalRaw.amount ?? totalRaw.value)
      : totalRaw != null
        ? num(totalRaw)
        : undefined;
  const currency =
    (totalRaw && typeof totalRaw === 'object' && totalRaw.currency) ||
    o.currency ||
    'LKR';
  return {
    payUrl:
      o.pay_url ??
      o.payUrl ??
      o.payment_url ??
      o.paymentUrl ??
      o.checkout_url ??
      o.pay_link ??
      o.url ??
      '',
    orderNumber:
      o.order_number ?? o.orderNumber ?? o.orderId ?? o.order_id ?? o.id ?? '',
    total,
    currency,
    expiresAt:
      o.expires_at ?? o.expiresAt ?? o.expiry ?? o.price_lock_expires_at ?? '',
  };
}

export interface TrackingEvent {
  label: string;
  time?: string;
  done?: boolean;
}

export interface TrackingResult {
  orderNumber: string;
  status: string;
  recipient?: string;
  items: { name: string; quantity?: number }[];
  events: TrackingEvent[];
}

/** Normalise an MCP track-order result into a status timeline. */
export function extractTracking(result: Any): TrackingResult {
  const d = unwrap(result) ?? {};
  const o = d.order ?? d;

  const recipientRaw = o.recipient ?? o.recipient_name ?? o.deliver_to;
  const recipient =
    typeof recipientRaw === 'object'
      ? recipientRaw?.name ?? recipientRaw?.recipient_name
      : recipientRaw;

  const itemsRaw = findArray(o.items ?? o.cart ?? o.products ?? o);
  const items = itemsRaw.map((it: Any) => ({
    name: it.name ?? it.title ?? it.product_name ?? 'Item',
    quantity: it.quantity ?? it.qty,
  }));

  const eventsRaw = findArray(
    o.events ?? o.timeline ?? o.progress ?? o.history ?? o.tracking ?? []
  );
  const events: TrackingEvent[] = eventsRaw.map((e: Any) => ({
    label: e.label ?? e.status ?? e.description ?? e.state ?? e.title ?? 'Update',
    time: e.time ?? e.timestamp ?? e.date ?? e.at ?? e.created_at,
    done: e.done ?? e.completed ?? true,
  }));

  return {
    orderNumber: o.order_number ?? o.orderNumber ?? o.id ?? '',
    status: o.status ?? o.state ?? o.current_status ?? 'In progress',
    recipient: recipient || undefined,
    items,
    events,
  };
}
