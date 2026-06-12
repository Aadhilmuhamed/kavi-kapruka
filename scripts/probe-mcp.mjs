// Probe the live Kapruka MCP server and dump raw tool result shapes.
// Run: node scripts/probe-mcp.mjs
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const ENDPOINT = 'https://mcp.kapruka.com/mcp';

function show(label, v) {
  console.log(`\n===== ${label} =====`);
  console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2));
}

const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT));
const client = new Client({ name: 'kavi-probe', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

const tools = await client.listTools();
for (const t of tools.tools) {
  const props = t.inputSchema?.$defs
    ? Object.values(t.inputSchema.$defs)[0]?.properties
    : t.inputSchema?.properties;
  console.log(`\n## ${t.name} :: params keys =`, props ? Object.keys(props) : '(flat)');
}

async function call(name, params) {
  try {
    const r = await client.callTool({ name, arguments: { params } });
    const txt = r?.content?.find((c) => c.type === 'text')?.text ?? '';
    show(`${name} RESULT (isError=${r.isError})`, txt.slice(0, 1500));
    return txt;
  } catch (e) {
    show(`${name} ERROR`, String(e));
    return '';
  }
}

const searchTxt = await call('kapruka_search_products', {
  q: 'chocolate',
  limit: 3,
  response_format: 'json',
});

let pid = null;
try {
  const j = JSON.parse(searchTxt);
  const arr = j.items || j.products || j.results || j.data || (Array.isArray(j) ? j : []);
  pid = arr?.[0]?.id ?? arr?.[0]?.product_id ?? null;
  console.log('\n[search JSON top-level keys]:', Object.keys(j));
  console.log('[first product keys]:', arr?.[0] ? Object.keys(arr[0]) : 'none');
} catch (e) {
  console.log('\n[search not JSON]:', String(e));
}
console.log('[first product id]:', pid);

await call('kapruka_list_categories', { depth: 1, response_format: 'json' });
await call('kapruka_list_delivery_cities', { query: 'colombo', limit: 3, response_format: 'json' });
if (pid) await call('kapruka_get_product', { product_id: pid, response_format: 'json' });

await client.close();
console.log('\n[probe done]');
