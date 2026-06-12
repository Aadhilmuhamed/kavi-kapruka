# CLAUDE.md — KAVI (Kapruka AI Shopping Agent)

Guidance for Claude Code working in this repo.

## What this is
Kavi (කවි) — AI shopping agent for Kapruka.com. Conversational chat UI that searches products, builds a cart, runs checkout, returns a pay link. Built for Kapruka Agent Challenge 2026 (deadline 25 June 2026).

## Stack (use exactly this — no alternatives)
- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **Styling:** Tailwind CSS + Framer Motion v11
- **AI:** Vercel AI SDK v4 (`ai`) + `@ai-sdk/anthropic` (primary) + `@ai-sdk/google` (Gemini fallback). `lib/model.ts` picks: Anthropic first, auto-falls back to Gemini only on billing/auth failure (cached 1-token preflight, 5-min TTL). Env: `ANTHROPIC_API_KEY` and/or `GOOGLE_GENERATIVE_AI_API_KEY`.
- **State:** Zustand v5 (use individual selectors, NOT object selectors — they loop without `useShallow`)
- **MCP:** `experimental_createMCPClient` (from `ai`) + `StreamableHTTPClientTransport` (from `@modelcontextprotocol/sdk/client/streamableHttp.js`) → `https://mcp.kapruka.com/mcp`. NOTE: `@ai-sdk/mcp` is not a real package — the plan's name is wrong; this is the correct v4 API.
- **Model:** `claude-haiku-4-5-20251001` (Haiku 4.5 — fast + cheap)
- **Hosting:** Vercel Hobby

## Commands
```bash
npm run dev      # local dev
npm run build    # prod build
vercel --prod    # deploy
```
Env: `ANTHROPIC_API_KEY` in `.env.local` (local) + Vercel dashboard (prod).

## Architecture
- `app/api/chat/route.ts` — Vercel AI SDK ↔ Kapruka MCP bridge. `streamText`, `maxSteps: 10`, opens MCP client, closes in `onFinish`.
- `app/page.tsx` — full-screen chat shell. `useChat`, header, welcome/chat switch, cart drawer.
- `lib/kavi-prompt.ts` — Kavi system prompt (personality, Sinhala rules, gift advisor, checkout flow).
- `store/cart.ts` — Zustand: cart items + checkout step machine + pay link.
- `components/` — chat/ (incl. QuickActions, VoiceButton), products/, checkout/ (incl. TrackOrderCard), gift/ (GiftAdvisor guided flow), ui/.
- `lib/speech.ts` — browser Web Speech API. Voice IN (SpeechRecognition → mic button) + voice OUT (speechSynthesis → header speaker toggle, speaks Kavi replies via `onFinish`). No key, no cost. Degrades silently when unsupported.

## MCP call contract (VERIFIED against live server — do not regress)
- Every tool takes args wrapped as `{ params: {...} }`. The route's `forceJsonResponses` wrapper auto-wraps + injects `response_format: 'json'` on every call. Without JSON, tools return markdown → blank cards.
- `kapruka_search_products` returns `{ results: [...], next_cursor, applied_filters }`. Each product: `id`, `name`, `summary`, `price: { amount, currency }` (OBJECT, not number), `in_stock`, `stock_level`, `image_url`, `category`, `url`.
- `kapruka_list_categories` → `{ categories: [{ name, url }] }`. `kapruka_list_delivery_cities` → `{ cities: [{ name, aliases }], total_matched, showing }`.
- Empty search returns a plain-text "No products found…" string (not JSON) — `mcp-parse.unwrap` falls back to string and the carousel shows its empty state.
- Probe scripts: `node scripts/probe-mcp.mjs` (dump shapes), `node scripts/verify-parse.mjs` (prove cards parse). No API key needed — MCP is free/no-auth.
- Limits: 60 req/min, 30 `create_order`/hr per IP. Pay link locked 60 min.

## MCP tools → UI render map
| Tool | Result render |
|------|---------------|
| `kapruka_search_products` | `<ProductCarousel>` |
| `kapruka_get_product` | `<ProductCarousel>` (single) |
| `kapruka_list_categories` | text + welcome chips |
| `kapruka_list_delivery_cities` | AI text |
| `kapruka_check_delivery` | AI text (warn perishables for cake/flowers) |
| `kapruka_create_order` | `<PayLinkCard>` |
| `kapruka_track_order` | AI text |

MCP result field names may be camelCase OR snake_case, and results may be wrapped in an MCP `content[].text` JSON-string envelope. `lib/mcp-parse.ts` (`extractProducts`, `extractOrder`, `unwrap`) normalises all shapes; `MessageBubble.tsx` calls it. Inspect actual shape in devtools Network tab on first run and tune the key lists in `mcp-parse.ts` if needed.

## Conventions
- **Light "premium Kavi" theme** (matches Kapruka.com). Tokens in `tailwind.config.ts`: `bg` (white/cream surfaces), `accent` (#C8102E Kapruka red), `purple` (#6D28D9 Kapruka purple), `cream` (now holds DARK ink text — name kept so `text-cream` still works), `muted`, `border` (dark alpha). Shadows: `shadow-card`, `shadow-pop`.
- **Language lock:** `route.ts` `languageDirective()` detects Sinhala Unicode (U+0D80–U+0DFF) in the latest user message and injects a hard per-request directive — English in → English out, Sinhala in → Sinhala out. Deterministic, overrides model drift.
- **Multi-key Gemini:** `lib/model.ts` reads `GOOGLE_GENERATIVE_AI_API_KEY[_2/_3]` or `GEMINI_API_KEYS` (comma) — round-robins keys, 60s cooldown on quota/429.
- Product cards show **Add to cart** + **View ↗** (opens `product.url` on kapruka.com).
- Fonts: Instrument Serif (display), DM Sans (body).
- Every list item animated via Framer Motion. No text walls — show product cards.
- Never expose raw JSON / tool params / errors to user.
- Mobile-first. Must work at 375px.

## Scoring priorities (build order)
1. Experience & polish (30) — animation, speed, zero dead-ends, mobile
2. Visual richness (20) — image cards, carousels
3. Personality (15) — warm, witty, Sinhala-aware
4. Usefulness (15) — gift advisor flow
5. E2E completeness (15) — search→cart→delivery→pay
6. Creativity (5) — gift advisor mode

## Personality rules (Kavi)
- English default, weave Sinhala naturally: ආයුබෝවන් (welcome), ස්තූතියි (thanks), හොඳයි (good).
- Mirror user if they write Sinhala/Singlish. Never force it.
- Concise: 2-4 sentences text, then products. Emojis sparingly: 🛒 🎁 🇱🇰 ✅ 🎉.
- Never "I cannot" / dead ends. Always offer next step.
