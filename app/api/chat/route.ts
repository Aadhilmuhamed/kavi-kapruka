import { streamText, experimental_createMCPClient, type Tool } from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { KAVI_SYSTEM_PROMPT } from "@/lib/kavi-prompt";
import { getChatModel } from "@/lib/model";

export const maxDuration = 30;
export const runtime = "nodejs";

const MCP_URL = "https://mcp.kapruka.com/mcp";

type MCPClient = Awaited<ReturnType<typeof experimental_createMCPClient>>;

/**
 * Kapruka search is literal: generic words ("flowers", "phone") return nothing,
 * but specific nouns/brands ("roses", "mobile", "samsung") work. The model isn't
 * always disciplined about this, so we rewrite vague queries deterministically
 * before they hit the catalog — cards then show even if the model picks a lazy term.
 */
function normalizeSearchQuery(q: string): string {
  const s = q.toLowerCase();
  // Brand/model queries already work — leave them alone.
  if (/(samsung|redmi|xiaomi|nubia|sony|huawei|oppo|vivo|realme|apple|iphone|nokia|infinix|tecno|jbl|hp|dell|lenovo|asus|acer)/.test(s)) {
    return q;
  }
  if (/\b(flowers?|floral|bouquets?|blooms?)\b/.test(s)) return 'roses';
  // "mobile"/"phone" match seller-store directory pages; "smartphone" returns real handsets.
  if (/(smart\s?phones?|cell\s?phones?|mobile\s?phones?|\bphones?\b|\bmobiles?\b|handset)/.test(s)) {
    return 'smartphone';
  }
  // Bare "jewellery"/"jewelry" (esp. with a category filter) matches gift-voucher
  // and storage-box listings; "necklace" returns real jewellery pieces.
  if (/\bjewel(?:le)?ry\b/.test(s)) return 'necklace';
  return q;
}

/**
 * For a phone search, drop accessory results (stands, gimbals, cases, cables…)
 * that match the word "smartphone" but aren't actual devices. Mutates the JSON
 * inside the MCP text envelope. No-op if it would empty the list.
 */
const ACCESSORY_RE =
  /\b(stand|holder|mount|gimbal|stabili[sz]er|tripod|case|cover|pouch|sleeve|cable|charger|adapter|protector|tempered|screen ?guard|guard|strap|lens|selfie ?stick|ring ?light|grip|stylus|earphone|earbud|headphone|powerbank|power ?bank)\b/i;
// "necklace" shares the word "chain" with hardware listings (door/security chains)
// and chain-strap watches — both rank highly but aren't jewellery. Drop them.
const JEWELRY_JUNK_RE = /\b(door|security|gate|padlock|cabinet|drawer|bike|dog ?leash|watch)\b/i;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripByName(res: any, junkRe: RegExp): any {
  try {
    const part = res?.content?.find((c: { type: string }) => c.type === 'text');
    if (!part || typeof part.text !== 'string') return res;
    const j = JSON.parse(part.text);
    const key = j.results ? 'results' : j.items ? 'items' : j.products ? 'products' : null;
    const arr = key ? j[key] : Array.isArray(j) ? j : null;
    if (!Array.isArray(arr)) return res;
    const filtered = arr.filter(
      (p: { name?: string; title?: string }) => !junkRe.test(p.name || p.title || '')
    );
    if (filtered.length === 0 || filtered.length === arr.length) return res;
    if (key) j[key] = filtered;
    part.text = JSON.stringify(key ? j : filtered);
    return res;
  } catch {
    return res;
  }
}

/** Detect an "empty"/error search result so we can retry with a looser query. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isEmptySearch(res: any): boolean {
  try {
    const txt =
      res?.content?.find((c: { type: string }) => c.type === 'text')?.text ??
      (typeof res === 'string' ? res : '');
    if (!txt) return false;
    if (/no products found|not found|rate limit/i.test(txt)) return true;
    try {
      const j = JSON.parse(txt);
      const arr = j.results || j.items || j.products || j.data || (Array.isArray(j) ? j : []);
      return Array.isArray(arr) && arr.length === 0;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Every Kapruka tool accepts a `response_format` of 'markdown' (default) or
 * 'json'. We force 'json' on every call so the UI can render structured product
 * cards / pay links instead of trying to scrape markdown. This is independent
 * of whatever the model decides to send, so cards always have clean data.
 * Args arrive wrapped as `{ params: {...} }` per the MCP input schema.
 */
function forceJsonResponses(raw: Record<string, Tool>): Record<string, Tool> {
  const wrapped: Record<string, Tool> = {};
  for (const [name, tool] of Object.entries(raw)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = tool as any;
    if (typeof original.execute !== 'function') {
      wrapped[name] = tool;
      continue;
    }
    wrapped[name] = {
      ...tool,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      execute: async (args: any, opts: any) => {
        // Every Kapruka tool expects { params: {...} }. Normalise to that shape
        // and force JSON — rescues the call even if the model forgets to wrap args.
        const inner: Record<string, unknown> =
          args && typeof args === 'object'
            ? { ...(args.params && typeof args.params === 'object' ? args.params : args) }
            : {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const run = (p: Record<string, unknown>): Promise<any> =>
          original.execute({ params: { ...p, response_format: 'json' } }, opts);

        if (name !== 'kapruka_search_products') {
          return run(inner);
        }

        // Rewrite vague queries to terms the catalog actually matches. A category
        // filter paired with a vague q is the #1 cause of junk (gift vouchers,
        // storage boxes) outranking real products — drop it whenever we rewrite,
        // since isEmptySearch can't catch "wrong but non-empty" results.
        if (typeof inner.q === 'string') {
          const rewritten = normalizeSearchQuery(inner.q);
          if (rewritten !== inner.q && inner.category) delete inner.category;
          inner.q = rewritten;
        }

        // price_asc on gadget searches surfaces cheap accessories (phone stands,
        // cases) above real devices. Force relevance so actual phones rank first;
        // max_price still honours the budget.
        if (inner.q === 'smartphone' && inner.sort === 'price_asc') {
          delete inner.sort;
        }

        let res = await run(inner);

        // If empty, progressively LOOSEN the query inside this single tool call so
        // the model gets results first try and never has to visibly "retry" / apologise.
        if (isEmptySearch(res)) {
          const loosened: Record<string, unknown>[] = [];
          // 1) drop category (vague q + category is the #1 cause of 0 hits)
          if (inner.category) {
            const { category, ...r } = inner;
            void category;
            loosened.push(r);
          }
          // 2) drop price filters too (budget can exclude everything)
          if (inner.min_price != null || inner.max_price != null) {
            const { category, min_price, max_price, ...r } = inner;
            void category;
            void min_price;
            void max_price;
            loosened.push(r);
          }
          for (const attempt of loosened) {
            res = await run(attempt);
            if (!isEmptySearch(res)) break;
          }
        }
        // Strip stray junk that slips in on a shared keyword.
        if (inner.q === 'smartphone') res = stripByName(res, ACCESSORY_RE);
        if (inner.q === 'necklace') res = stripByName(res, JEWELRY_JUNK_RE);
        return res;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }
  return wrapped;
}

/** Build a hard per-request language directive from the user's latest message. */
function languageDirective(messages: Array<{ role: string; content: unknown }>): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text =
    typeof lastUser?.content === "string"
      ? lastUser.content
      : Array.isArray(lastUser?.content)
        ? (lastUser.content as Array<{ text?: string }>)
            .map((p) => p?.text ?? "")
            .join(" ")
        : "";
  // Sinhala Unicode block is U+0D80–U+0DFF. Check by code point (robust against
  // source-encoding quirks with literal ranges).
  const hasSinhala = Array.from(text).some((ch) => {
    const c = ch.codePointAt(0) ?? 0;
    return c >= 0x0d80 && c <= 0x0dff;
  });
  console.log(`[Kavi] language lock: ${hasSinhala ? "Sinhala" : "English"}`);
  if (hasSinhala) {
    return "\n\n# LANGUAGE LOCK (highest priority)\nThe user's latest message is in SINHALA. Reply ENTIRELY in Sinhala script. Keep only product names, brand names and prices in English. Do NOT reply in English.";
  }
  return "\n\n# LANGUAGE LOCK (highest priority)\nThe user's latest message is in ENGLISH. Reply in ENGLISH. You may use at most ONE short Sinhala greeting word (e.g. ආයුබෝවන් or ස්තූතියි); every other word must be English. Do NOT reply in full Sinhala.";
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  let mcpClient: MCPClient | null = null;
  let tools: Record<string, Tool> = {};

  // Connect to the Kapruka MCP server (Streamable HTTP transport).
  // If it's unreachable we degrade gracefully rather than dead-end the chat.
  try {
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
    mcpClient = await experimental_createMCPClient({ transport });
    tools = forceJsonResponses(await mcpClient.tools());
  } catch (err) {
    console.error(
      "[Kavi] MCP connection failed, continuing without tools:",
      err,
    );
    if (mcpClient) {
      await mcpClient.close().catch(() => {});
      mcpClient = null;
    }
  }

  // Anthropic first; auto-fallback to multi-key Gemini if Anthropic has no billing.
  const { model, provider, onQuotaError, keyIndex } = await getChatModel();
  console.log(
    `[Kavi] using provider: ${provider}${keyIndex ? ` (gemini key #${keyIndex})` : ""}`,
  );

  const result = streamText({
    model,
    system: KAVI_SYSTEM_PROMPT + languageDirective(messages),
    messages,
    tools,
    maxSteps: 10, // allow chained tool calls: search → get_product → check_delivery → create_order
    onFinish: async () => {
      if (mcpClient) {
        await mcpClient.close().catch(() => {});
      }
    },
    onError: ({ error }) => {
      const msg = error instanceof Error ? error.message : String(error);
      // Cool the current Gemini key down so the next request rotates to another.
      if (/quota|rate.?limit|429|resource.?exhausted/i.test(msg)) onQuotaError?.();
      console.error("[Kavi] streamText error:", error);
    },
  });

  return result.toDataStreamResponse({
    getErrorMessage: (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (/credit balance|billing|quota|insufficient|payment/i.test(msg)) {
        return "Kavi's AI provider is out of credits 🙏 — add billing to your Anthropic OR Gemini key, then try again.";
      }
      if (/x-api-key|authentication|api[_ ]?key|unauthorized|permission/i.test(msg)) {
        return "Kavi needs a valid API key — set ANTHROPIC_API_KEY (preferred) or GOOGLE_GENERATIVE_AI_API_KEY.";
      }
      if (/rate.?limit|overloaded/i.test(msg)) {
        return "Kavi is a bit busy right now 🛍️ — give it a moment and try again.";
      }
      return "Oops — something hiccupped. Mind trying that again? 🙏";
    },
  });
}
