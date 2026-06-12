import { streamText, experimental_createMCPClient, type Tool } from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { KAVI_SYSTEM_PROMPT } from "@/lib/kavi-prompt";
import { getChatModel } from "@/lib/model";

export const maxDuration = 30;
export const runtime = "nodejs";

const MCP_URL = "https://mcp.kapruka.com/mcp";

type MCPClient = Awaited<ReturnType<typeof experimental_createMCPClient>>;

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
        // Every Kapruka tool expects { params: {...} }. Always normalise to that
        // shape and force JSON — rescues the call even if the model forgets to
        // wrap its arguments.
        let nextArgs = args;
        if (args && typeof args === 'object') {
          const inner =
            args.params && typeof args.params === 'object' ? args.params : args;
          nextArgs = { params: { ...inner, response_format: 'json' } };
        }
        return original.execute(nextArgs, opts);
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
