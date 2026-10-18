import type { ChatRequest, ChatResult, Embedder, LlmProvider } from './types';

// wide enough that two different words rarely land in the same slot
const DIMENSIONS = 2048;
const STOP = new Set(
  'a an and are as at be by can did do does for from has have he her his how i in is it its me my of on or our she so tell that the their them they this to was were what when where which who whom why will with you your yash about give show'.split(
    ' ',
  ),
);

/** FNV-1a: a small, stable hash, so the same word always lands in the same slot. */
function hash(word: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < word.length; i++) h = Math.imul(h ^ word.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** Lower-case words without common words, and with a plural 's' removed. */
export function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9+#]+/g) ?? [])
    .filter((w) => !STOP.has(w))
    .map((w) => w.replace(/(ing|ed)$/, (m, _s, offset) => (offset >= 4 ? '' : m)))
    .map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w));
}

function vectorFor(text: string): number[] {
  const v = new Array<number>(DIMENSIONS).fill(0);
  for (const w of words(text)) v[hash(w) % DIMENSIONS] += 1;
  const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

/** A fake embedder: a bag of hashed words. Texts that share words score high. For tests and local dev. */
export const mockEmbedder: Embedder = {
  dimensions: DIMENSIONS,
  // word overlap is a blunt tool: this is the value that separates the eval set best, not a good one
  suggestedMinScore: 0.12,
  embed: async (texts) => texts.map(vectorFor),
};

/** The id and text of the first note in a prompt written by rag/prompt.ts. */
function firstNote(request: ChatRequest) {
  const last = request.messages[request.messages.length - 1]?.content ?? '';
  const m = /<note id="([^"]+)">\n([\s\S]*?)\n<\/note>/.exec(last);
  return m ? { id: m[1]!, text: m[2]! } : null;
}

function reply(request: ChatRequest): string {
  const note = firstNote(request);
  if (!note) return 'That is not in my notes.';
  const first = note.text.split(/(?<=[.!?])\s/)[0] ?? note.text;
  return `From my notes: ${first} [${note.id}]`;
}

/** A fake chat model: it repeats the first sentence of the first note and cites it. Never follows instructions. */
export function createMockProvider(): LlmProvider {
  const finish = (request: ChatRequest, text: string): ChatResult => ({
    text,
    model: 'mock',
    inputTokens: Math.ceil(request.messages.map((m) => m.content).join(' ').length / 4),
    outputTokens: Math.ceil(text.length / 4),
    costMicroUsd: 0,
  });
  return {
    chat: async (request) => finish(request, reply(request)),
    async *chatStream(request) {
      const text = reply(request);
      for (const piece of text.split(/(?<=\s)/)) yield piece;
      return finish(request, text);
    },
  };
}
