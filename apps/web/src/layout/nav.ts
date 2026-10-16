import { CONTACT_LINKS } from '../../worker/rag/facts';

export type PageId = 'home' | 'projects' | 'experience' | 'contact';

/**
 * The pages the header and footer link to, in order. Experience is not here: it is on the home page now.
 * The /experience/ page still exists for old links and for the guide's buttons.
 */
export const navItems: { id: Exclude<PageId, 'home'>; label: string; href: string }[] = [
  { id: 'projects', label: 'Projects', href: '/projects/' },
  { id: 'contact', label: 'Contact', href: '/contact/' },
];

const c = CONTACT_LINKS;
export const GITHUB_URL = c.github;
export const LINKEDIN_URL = c.linkedin;
export const BOOKING_URL = c.booking;
export const EMAILS = { work: c.emailPersonal, university: c.emailSchool };
