import { CONTACT_LINKS } from '../../worker/rag/facts';

export type PageId = 'home' | 'projects' | 'experience' | 'contact';

/** The pages the header links to, in order. */
export const navItems: { id: Exclude<PageId, 'home'>; label: string; href: string }[] = [
  { id: 'projects', label: 'Projects', href: '/projects/' },
  { id: 'experience', label: 'Experience', href: '/experience/' },
  { id: 'contact', label: 'Contact', href: '/contact/' },
];

const c = CONTACT_LINKS;
export const GITHUB_URL = c.github;
export const LINKEDIN_URL = c.linkedin;
export const BOOKING_URL = c.booking;
export const EMAILS = { work: c.emailPersonal, university: c.emailSchool };
