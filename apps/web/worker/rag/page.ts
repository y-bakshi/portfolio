import { projects } from '../../src/content';

/**
 * Words for the page a visitor is reading, so "this project" has an answer. The path comes from the
 * browser, so it is only ever looked up here, never copied into the prompt. Returns null for a page
 * the site does not have.
 */
export function pageContext(path: unknown): string | null {
  if (typeof path !== 'string' || path.length > 120) return null;
  const clean = path.split(/[?#]/)[0].replace(/\/index\.html$/, '/');
  const project = /^\/projects\/([a-z0-9-]+)\/?$/.exec(clean)?.[1];
  if (project) {
    const found = projects.find((p) => p.id === project);
    return found ? `The visitor is reading the case study page for ${found.name}.` : null;
  }
  if (clean === '/') return 'The visitor is on the home page.';
  if (/^\/projects\/?$/.test(clean))
    return 'The visitor is on the page that lists all of the projects.';
  if (/^\/experience\/?$/.test(clean))
    return 'The visitor is on the experience page, which lists Yash’s jobs and degrees.';
  if (/^\/contact\/?$/.test(clean)) return 'The visitor is on the contact page.';
  return null;
}

/** Separates the open-page line the route adds from the visitor's question, and says what to search for. */
export function splitPage(given: string): { question: string; search: string } {
  const m = /^(The visitor is [^\n]*)\n([\s\S]*)$/.exec(given);
  if (!m) return { question: given, search: given };
  const project = /case study page for (.+)\.$/.exec(m[1])?.[1];
  const question = m[2];
  const named = project && !question.toLowerCase().includes(project.toLowerCase());
  return { question, search: named ? `${question} (${project})` : question };
}
