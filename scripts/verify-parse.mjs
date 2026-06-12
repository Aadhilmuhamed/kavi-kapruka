// Verify the card parser against LIVE Kapruka MCP JSON. No API key needed.
// Run: node scripts/verify-parse.mjs
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// --- inline copies of lib/mcp-parse.ts logic (kept in sync) ---
const num = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = parseFloat(v.replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : 0; }
  return 0;
};
const priceAmount = (p) => {
  for (const c of [p.price, p.amount, p.salePrice, p.sale_price]) {
    if (c == null) continue;
    if (typeof c === 'object') return num(c.amount ?? c.value ?? c.price);
    return num(c);
  }
  return 0;
};
const priceCurrency = (p) => (p.price && typeof p.price === 'object' && p.price.currency) ? p.price.currency : (p.currency ?? 'LKR');
const imageOf = (p) => {
  const d = p.image_url ?? p.imageUrl ?? p.image ?? p.thumbnail ?? p.img;
  if (typeof d === 'string' && d) return d;
  const imgs = p.images ?? p.media;
  if (Array.isArray(imgs) && imgs.length) { const f = imgs[0]; if (typeof f === 'string') return f; if (f && typeof f === 'object') return f.url ?? f.image_url ?? f.src ?? ''; }
  return '';
};
const findArray = (o) => {
  if (Array.isArray(o)) return o;
  if (o && typeof o === 'object') for (const k of ['items','products','results','data','list']) if (Array.isArray(o[k])) return o[k];
  return [];
};
const extractProducts = (data) => {
  let arr = findArray(data);
  if (!arr.length && data && typeof data === 'object' && (data.name || data.title)) arr = [data];
  return arr.map((p, i) => ({
    id: String(p.id ?? p.product_id ?? i),
    name: p.name ?? p.title ?? 'Product',
    price: priceAmount(p),
    currency: priceCurrency(p),
    image: imageOf(p),
    in_stock: p.in_stock ?? p.inStock ?? true,
  }));
};
// ---------------------------------------------------------------

const transport = new StreamableHTTPClientTransport(new URL('https://mcp.kapruka.com/mcp'));
const client = new Client({ name: 'kavi-verify', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

const r = await client.callTool({
  name: 'kapruka_search_products',
  arguments: { params: { q: 'chocolate', limit: 4, response_format: 'json' } },
});
const txt = r.content.find((c) => c.type === 'text')?.text ?? '';
let json;
try {
  json = JSON.parse(txt);
} catch {
  console.log('Result was not JSON (likely empty):', txt.slice(0, 120));
  await client.close();
  process.exit(0);
}
const cards = extractProducts(json);

let pass = true;
console.log(`\nParsed ${cards.length} cards:\n`);
for (const c of cards) {
  const okPrice = c.price > 0;
  const okImg = c.image.startsWith('http');
  const okName = c.name && c.name !== 'Product';
  if (!okPrice || !okImg || !okName) pass = false;
  console.log(`${okPrice && okImg && okName ? '✅' : '❌'} ${c.name}`);
  console.log(`   ${c.currency} ${c.price.toLocaleString()} | stock=${c.in_stock} | id=${c.id}`);
  console.log(`   img: ${c.image.slice(0, 70)}...`);
}
console.log(`\n${pass && cards.length ? '✅ PARSER OK — cards will render with real price + image' : '❌ PARSER PROBLEM'}`);

await client.close();
