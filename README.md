# Kavi — Kapruka AI Shopping Agent 🇱🇰

> කවි — Sri Lanka's AI shopping companion. Chat to find gifts, browse products, checkout in minutes.
>
> Built for **Kapruka Agent Challenge 2026** · Deadline 25 June 2026

A conversational shopping agent over the Kapruka MCP. Search → cart → delivery → pay link, all in chat. Warm, witty, Sinhala-aware personality.

## Features
- 🔍 Natural-language product search → visual image-card carousels
- 🎁 **Gift Advisor Mode** — guided who/budget/occasion flow → perfect picks
- 🛒 Multi-item cart with live count
- 📦 Checkout: city → date → recipient → gift message → confirm
- 💳 Secure pay-link card (prices locked 60 min)
- 🇱🇰 Bilingual personality — English + natural Sinhala
- 🎙️ **Voice** — speak to Kavi (mic → speech-to-text, auto-send) and hear replies (toggle). Browser-native, free
- 🤖 Dual AI — Anthropic Claude (primary) with automatic Gemini fallback on billing failure
- 📱 Mobile-perfect, animated, dark theme

## Stack
Next.js 16 (Turbopack) · React 19 · TypeScript · Tailwind · Framer Motion v11 · Zustand · Vercel AI SDK v4 · `@ai-sdk/anthropic` · `@modelcontextprotocol/sdk` · MCP (`mcp.kapruka.com/mcp`) · `claude-haiku-4-5` · Vercel Hobby

## Quick start
```bash
npx create-next-app@latest kavi --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd kavi
npm install ai @ai-sdk/anthropic @ai-sdk/mcp framer-motion zustand clsx tailwind-merge
npm install -D @types/node
```

`.env.local`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Run:
```bash
npm run dev      # http://localhost:3000
```

## Deploy
```bash
npm i -g vercel
vercel --prod
vercel env add ANTHROPIC_API_KEY production
```
Test live URL in incognito + on real mobile before submitting.

## Structure
```
app/
  api/chat/route.ts   AI SDK + MCP bridge
  page.tsx            chat shell
  layout.tsx          dark theme, fonts
lib/
  kavi-prompt.ts      system prompt
  utils.ts            cn()
store/
  cart.ts             Zustand cart + checkout
components/
  chat/               ChatWindow, ChatInput, MessageBubble, TypingIndicator, WelcomeScreen
  products/           ProductCard, ProductCarousel, ProductSkeleton
  checkout/           CartDrawer, CartItem, CheckoutFlow, PayLinkCard
  ui/                 Button, Badge
```

## MCP tools
`kapruka_search_products` · `kapruka_get_product` · `kapruka_list_categories` · `kapruka_list_delivery_cities` · `kapruka_check_delivery` · `kapruka_create_order` · `kapruka_track_order`

## Validation checklist
- [ ] Search shows image cards + Add to Cart
- [ ] Cart count updates in header
- [ ] Checkout flow city→date→recipient→confirm works
- [ ] `kapruka_create_order` → PayLinkCard with working link
- [ ] Mobile 375px layout
- [ ] Animations + typing indicator
- [ ] Sinhala in greeting + confirmation
- [ ] No raw JSON anywhere
- [ ] Opens without login in incognito

## Submission
Register: `kapruka.com/contactUs/agentChallengeApply.html` · Submit live Vercel URL before 30 June 2026 · MCP issues: hello@kapruka.com

🤖 Built with [Claude Code](https://claude.com/claude-code)
