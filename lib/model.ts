import { anthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, type LanguageModel } from 'ai';

/**
 * Provider strategy
 * -----------------
 * Priority: Anthropic (Claude Haiku 4.5). If the Anthropic key has no billing /
 * credits / is invalid, automatically fall back to Google Gemini.
 *
 * Gemini supports MULTIPLE keys (free-tier quota is per-key). We round-robin
 * across all configured keys and put any key that hits a quota/429 error on a
 * short cooldown, so one exhausted key doesn't break the app.
 *
 * Streaming responses can't cleanly retry mid-flight, so we run a tiny cached
 * "preflight" (1-token generate) to decide Anthropic-vs-Gemini.
 */

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
// gemini-2.0-flash has a 0 free-tier quota on many keys; 2.5-flash works on free tier.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const PREFLIGHT_TTL = 5 * 60 * 1000; // 5 min
const KEY_COOLDOWN = 60 * 1000; // 60s after a quota error

export type ProviderName = 'anthropic' | 'google';

const hasAnthropic = () => !!process.env.ANTHROPIC_API_KEY;

/** Collect every configured Gemini key: comma bundle + numbered slots, deduped. */
function geminiKeys(): string[] {
  const keys: string[] = [];
  const bundle = process.env.GEMINI_API_KEYS; // "key1,key2,key3"
  if (bundle) keys.push(...bundle.split(',').map((s) => s.trim()).filter(Boolean));
  for (const k of [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ]) {
    if (k && k.trim()) keys.push(k.trim());
  }
  return [...new Set(keys)];
}

const hasGoogle = () => geminiKeys().length > 0;

// Per-key cooldown timestamps (module-level, survives across requests in a warm instance).
const cooldownUntil: Record<number, number> = {};
let geminiPointer = 0;

// Errors that mean "this Anthropic key can't be used" → fall back to Gemini.
const FATAL_RE =
  /credit balance|billing|quota|insufficient|payment required|x-api-key|authentication|invalid[_ ]?api[_ ]?key|permission|unauthorized|forbidden|account/i;

interface Health {
  ok: boolean;
  at: number;
}
let anthropicHealth: Health | null = null;

async function anthropicUsable(): Promise<boolean> {
  if (!hasAnthropic()) return false;

  const now = Date.now();
  if (anthropicHealth && now - anthropicHealth.at < PREFLIGHT_TTL) {
    return anthropicHealth.ok;
  }

  try {
    await generateText({
      model: anthropic(ANTHROPIC_MODEL),
      prompt: 'ping',
      maxTokens: 1,
    });
    anthropicHealth = { ok: true, at: now };
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (FATAL_RE.test(msg)) {
      console.warn('[Kavi] Anthropic unusable, falling back to Gemini:', msg);
      anthropicHealth = { ok: false, at: now };
      return false;
    }
    console.warn('[Kavi] Anthropic preflight transient error, keeping Anthropic:', msg);
    anthropicHealth = { ok: true, at: now };
    return true;
  }
}

export interface ChosenModel {
  model: LanguageModel;
  provider: ProviderName;
  /** Gemini only: call when this request hits a quota error to cool the key down. */
  onQuotaError?: () => void;
  /** 1-based index of the Gemini key used (for logging). */
  keyIndex?: number;
}

/** Pick a Gemini model from the next non-cooled key (round-robin). */
function pickGeminiModel(): ChosenModel | null {
  const keys = geminiKeys();
  if (!keys.length) return null;
  const now = Date.now();

  const build = (idx: number): ChosenModel => {
    geminiPointer = (idx + 1) % keys.length;
    const provider = createGoogleGenerativeAI({ apiKey: keys[idx] });
    return {
      model: provider(GEMINI_MODEL),
      provider: 'google',
      keyIndex: idx + 1,
      onQuotaError: () => {
        cooldownUntil[idx] = Date.now() + KEY_COOLDOWN;
        console.warn(
          `[Kavi] Gemini key #${idx + 1} hit quota — cooling down ${KEY_COOLDOWN / 1000}s`
        );
      },
    };
  };

  // Try each key once, starting at the rotating pointer, skipping cooled-down keys.
  for (let n = 0; n < keys.length; n++) {
    const idx = (geminiPointer + n) % keys.length;
    if ((cooldownUntil[idx] ?? 0) <= now) return build(idx);
  }

  // All cooled down — pick the one whose cooldown ends soonest.
  let best = 0;
  let bestT = Infinity;
  keys.forEach((_, i) => {
    const t = cooldownUntil[i] ?? 0;
    if (t < bestT) {
      bestT = t;
      best = i;
    }
  });
  return build(best);
}

/** Pick the chat model: Anthropic first, multi-key Gemini fallback. */
export async function getChatModel(): Promise<ChosenModel> {
  if (await anthropicUsable()) {
    return { model: anthropic(ANTHROPIC_MODEL), provider: 'anthropic' };
  }
  const gemini = pickGeminiModel();
  if (gemini) return gemini;
  // Neither usable: return Anthropic so the route surfaces a clear billing message.
  return { model: anthropic(ANTHROPIC_MODEL), provider: 'anthropic' };
}

/** True when at least one provider key is configured. */
export function hasAnyProvider(): boolean {
  return hasAnthropic() || hasGoogle();
}

/** How many Gemini keys are configured (for logging/diagnostics). */
export function geminiKeyCount(): number {
  return geminiKeys().length;
}
