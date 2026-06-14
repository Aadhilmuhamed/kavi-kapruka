// Probe specific search queries (slow, to respect rate limit).
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const ENDPOINT = 'https://mcp.kapruka.com/mcp';
const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT));
const client = new Client({ name: 'kavi-probe-q', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(params, label) {
  try {
    const r = await client.callTool({
      name: 'kapruka_search_products',
      arguments: { params: { limit: 3, response_format: 'json', ...params } },
    });
    const txt = r?.content?.find((c) => c.type === 'text')?.text ?? '';
    let count = 0, first = '';
    try {
      const j = JSON.parse(txt);
      const arr = j.results || j.items || j.products || j.data || (Array.isArray(j) ? j : []);
      count = arr.length;
      first = arr[0]?.name || arr[0]?.title || '';
    } catch { first = '[txt] ' + txt.slice(0, 70); }
    console.log(`${label.padEnd(34)} → ${count}  ${first ? '| ' + first : ''}`);
  } catch (e) {
    console.log(`${label.padEnd(34)} → ERR ${String(e).slice(0, 60)}`);
  }
}

const terms = [
  ['q=samsung', { q: 'samsung' }],
  ['q=redmi', { q: 'redmi' }],
  ['q=iphone', { q: 'iphone' }],
  ['q=mobile', { q: 'mobile' }],
  ['q=headphone', { q: 'headphone' }],
  ['q=rice', { q: 'rice' }],
  ['q=milk powder', { q: 'milk powder' }],
  ['q=soap', { q: 'soap' }],
  ['q=tshirt', { q: 'tshirt' }],
  ['q=perfume', { q: 'perfume' }],
];
for (const [label, p] of terms) {
  await search(p, label);
  await sleep(2500);
}

await client.close();
console.log('\n[done]');
