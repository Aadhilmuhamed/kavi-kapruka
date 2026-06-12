// Find which Gemini model works on this key's free tier.
// Run: GOOGLE_GENERATIVE_AI_API_KEY=xxx node scripts/probe-gemini.mjs
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-flash-latest',
];

for (const id of MODELS) {
  try {
    const { text } = await generateText({
      model: google(id),
      prompt: 'Reply with the single word: ok',
      maxTokens: 10,
    });
    console.log(`✅ ${id} -> ${JSON.stringify(text.trim().slice(0, 30))}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const short = msg.split('\n')[0].slice(0, 90);
    const code = /quota|429/i.test(msg) ? 'QUOTA' : /not found|404/i.test(msg) ? 'NOT_FOUND' : /api key|403|permission/i.test(msg) ? 'AUTH' : 'ERR';
    console.log(`❌ ${id} [${code}] ${short}`);
  }
}
