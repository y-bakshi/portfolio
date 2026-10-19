import { education, projects, roles } from '../content';

/** The page that shows a cited item, for when the current page does not have it. */
export function destinationFor(id: string): string {
  if (projects.some((p) => p.id === id)) return `/projects/#${id}`;
  if (roles.some((r) => r.id === id) || education.some((e) => e.id === id)) return `/#${id}`;
  if (id === 'contact') return '/contact/';
  return '/';
}
