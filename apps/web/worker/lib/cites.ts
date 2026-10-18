import { education, projects, roles } from '../../src/content';

/** Ids of the cards on the page that an answer may point to, plus the contact page. */
export const CARD_IDS: ReadonlySet<string> = new Set([
  ...projects.map((p) => p.id),
  ...roles.map((r) => r.id),
  ...education.map((e) => e.id),
  'contact',
]);

/** Keeps only ids of real cards, once each, in order. A model can invent ids; this drops them. */
export function validCites(ids: readonly string[], known: ReadonlySet<string> = CARD_IDS) {
  return [...new Set(ids)].filter((id) => known.has(id));
}
