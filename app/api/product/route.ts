import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { extractProducts } from '@/lib/mcp-parse';

export const runtime = 'nodejs';
export const maxDuration = 20;

const MCP_URL = 'https://mcp.kapruka.com/mcp';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function num(v: Any): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  if (v && typeof v === 'object') return num(v.amount ?? v.value);
  return 0;
}

/** Pick a query that surfaces products similar to this one. */
function similarQuery(d: Any): string {
  const sub = String(d?.attributes?.subtype ?? '').toLowerCase();
  const cat =
    typeof d?.category === 'string'
      ? d.category.toLowerCase()
      : String(d?.category?.name ?? '').toLowerCase();
  const name = String(d?.name ?? '').toLowerCase();
  const blob = `${sub} ${cat} ${name}`;
  if (/phone/.test(blob)) return 'smartphone';
  if (/flower|rose|bouquet|bloom/.test(blob)) return 'roses';
  if (sub && sub.length > 2) return sub;
  if (cat && cat !== 'general' && cat.length > 2) return cat;
  return name.split(/\s+/).slice(0, 2).join(' ');
}

function textOf(res: Any): string {
  return res?.content?.find((c: Any) => c?.type === 'text')?.text ?? '';
}

// Phone-accessory names to keep out of "similar phones".
const ACCESSORY_RE =
  /\b(stand|holder|mount|gimbal|stabili[sz]er|tripod|case|cover|pouch|sleeve|cable|charger|adapter|protector|tempered|screen ?guard|guard|strap|lens|selfie ?stick|ring ?light|grip|stylus|earphone|earbud|headphone|powerbank|power ?bank)\b/i;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) return Response.json({ detail: null, similar: [] });

  let client: Client | null = null;
  try {
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
    client = new Client({ name: 'kavi-product', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);

    const call = (name: string, params: Record<string, unknown>) =>
      client!.callTool({ name, arguments: { params: { ...params, response_format: 'json' } } });

    // Full product detail
    const detRes = await call('kapruka_get_product', { product_id: id });
    let d: Any = {};
    try {
      d = JSON.parse(textOf(detRes));
      d = d.product ?? d.result ?? d;
    } catch {
      d = {};
    }

    const images: string[] = Array.isArray(d.images)
      ? d.images
          .map((im: Any) => (typeof im === 'string' ? im : im?.url ?? im?.src ?? ''))
          .filter(Boolean)
      : [];

    const detail = {
      id: String(d.id ?? id),
      name: d.name ?? '',
      description: (d.description ?? d.summary ?? '').toString(),
      price: num(d.price),
      compareAtPrice: d.compare_at_price ? num(d.compare_at_price) : undefined,
      currency:
        (d.price && typeof d.price === 'object' && d.price.currency) || d.currency || 'LKR',
      inStock: d.in_stock ?? true,
      stockLevel: d.stock_level ?? undefined,
      rating: d.rating ? num(d.rating) : undefined,
      vendor: d.attributes?.vendor ?? undefined,
      subtype: d.attributes?.subtype ?? undefined,
      images,
      url: d.url ?? '',
    };

    // Similar products
    let similar: Any[] = [];
    try {
      const sq = similarQuery(d);
      const simRes = await call('kapruka_search_products', { q: sq, limit: 12 });
      similar = extractProducts(textOf(simRes)).filter((p) => p.id !== detail.id);
      if (sq === 'smartphone') {
        similar = similar.filter((p) => !ACCESSORY_RE.test(p.name || ''));
      }
      similar = similar.slice(0, 8);
    } catch {
      similar = [];
    }

    return Response.json({ detail, similar });
  } catch (err) {
    console.error('[Kavi] /api/product failed:', err);
    return Response.json({ detail: null, similar: [] });
  } finally {
    if (client) await client.close().catch(() => {});
  }
}
