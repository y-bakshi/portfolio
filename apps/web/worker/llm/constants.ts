/**
 * The default Gemini model. The owner must confirm this name and its price on Google's pages
 * before launch; models are renamed and retired. Override it with the GEMINI_MODEL variable.
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

/** The Workers AI chat model used as the fallback, and the embedding model. Confirm both. */
export const WORKERS_AI_CHAT_MODEL = '@cf/meta/llama-3.1-8b-instruct';
export const WORKERS_AI_EMBED_MODEL = '@cf/baai/bge-base-en-v1.5';
export const WORKERS_AI_EMBED_DIMENSIONS = 768;

/** How long a provider may take before the next one in the chain is tried. */
export const PROVIDER_TIMEOUT_MS = 15_000;

/** Price per million tokens in integer micro-USD (1 USD = 1,000,000). Third-party estimates. */
export type Price = { input: number; output: number };

export const PRICES: Record<string, Price> = {
  // about $0.25 in, $1.50 out per million tokens
  'gemini-2.5-flash-lite': { input: 250_000, output: 1_500_000 },
  // about $1.50 in, $7.50 out per million tokens
  'gemini-2.5-flash': { input: 1_500_000, output: 7_500_000 },
};

/** Used for a model with no entry above, so an unknown model is never treated as free. */
export const FALLBACK_PRICE: Price = { input: 1_500_000, output: 7_500_000 };

/** Workers AI is billed in neurons with a free daily allowance; this is a cautious placeholder. */
export const WORKERS_AI_PRICE: Price = { input: 100_000, output: 300_000 };

/** Cost in integer micro-USD, rounded up so the budget is never under-counted. */
export function costMicroUsd(price: Price, inputTokens: number, outputTokens: number): number {
  return Math.ceil((inputTokens * price.input + outputTokens * price.output) / 1_000_000);
}
