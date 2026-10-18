import type { Chunk } from './types';

// a bracket holding one or more note ids such as [project:testpilot#detail] or [role:thryv, fact:contact]
const ID = '[a-z0-9-]+:[a-z0-9._:#-]+';
const MARKER = new RegExp(`^\\[\\s*${ID}(\\s*,\\s*${ID})*\\s*\\]$`, 'i');
const MAX_BRACKET = 160;

/**
 * Removes citation markers from text that arrives in pieces, so a marker split across two pieces is
 * still caught. Whitespace before a bracket is held back, so removing a marker leaves no gap.
 */
export class MarkerStripper {
  private held = '';
  private bracket: string | null = null;

  push(piece: string): string {
    let out = '';
    for (const ch of piece) {
      if (this.bracket !== null) {
        this.bracket += ch;
        if (ch === ']') out += this.close();
        else if (this.bracket.length > MAX_BRACKET) out += this.flush();
      } else if (/\s/.test(ch)) {
        this.held += ch;
      } else if (ch === '[') {
        this.bracket = '[';
      } else {
        out += this.held + ch;
        this.held = '';
      }
    }
    return out;
  }

  private close(): string {
    const text = this.bracket!;
    this.bracket = null;
    if (MARKER.test(text)) {
      this.held = '';
      return '';
    }
    const out = this.held + text;
    this.held = '';
    return out;
  }

  /** Whatever is still held when the text ends. */
  flush(): string {
    const out = this.held + (this.bracket ?? '');
    this.held = '';
    this.bracket = null;
    return out;
  }
}

/** The text with every citation marker removed. */
export function stripMarkers(text: string): string {
  const s = new MarkerStripper();
  return (s.push(text) + s.flush()).trim();
}

/** Every note id the model wrote in brackets, in order, repeated or not. */
export function markedIds(text: string): string[] {
  const ids: string[] = [];
  for (const m of text.matchAll(/\[([^\[\]]{1,160})\]/g)) {
    if (MARKER.test(m[0])) ids.push(...m[1]!.split(',').map((s) => s.trim()));
  }
  return ids;
}

/**
 * Keeps only the ids that were really given to the model, then maps them to the cards on the page.
 * An id the model made up is dropped, and so is a note that has no card, such as the general facts.
 */
export function validateCites(
  text: string,
  given: Chunk[],
  registry: ReadonlySet<string>,
): { chunkIds: string[]; sourceIds: string[] } {
  const byId = new Map(given.map((c) => [c.id, c]));
  const chunkIds = [...new Set(markedIds(text).filter((id) => byId.has(id)))];
  const sourceIds = [
    ...new Set(chunkIds.map((id) => byId.get(id)!.sourceId).filter((s) => registry.has(s))),
  ];
  return { chunkIds, sourceIds };
}
