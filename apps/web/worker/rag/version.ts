import type { Env } from '../env';
import { SYSTEM_PROMPT } from './prompt';
import { buildChunks } from './chunks';

/** A small, steady hash of some text (FNV-1a), as letters and digits. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/**
 * Names the notes, the rules and the model an answer was written with. A saved answer is only reused
 * while this stays the same, so editing a note, the prompt or the model never serves an old answer.
 */
export function answerVersion(env: Pick<Env, 'LLM_PROVIDER' | 'GEMINI_MODEL'>): string {
  const notes = buildChunks()
    .map((c) => `${c.id}\n${c.text}`)
    .join('\n');
  return hash(`${SYSTEM_PROMPT}\n${env.LLM_PROVIDER ?? ''}:${env.GEMINI_MODEL ?? ''}\n${notes}`);
}
