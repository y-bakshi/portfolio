import { CONTACT_LINKS as c } from '../../worker/rag/facts';

/**
 * How to reach Yash, for llms-full.txt and the structured data. The addresses come from the same list
 * the guide uses, and a test there checks that every one of them is shown in the page's contact band.
 */
export const contactList = [
  { label: 'Email (school)', href: `mailto:${c.emailSchool}` },
  { label: 'Email (personal)', href: `mailto:${c.emailPersonal}` },
  { label: 'LinkedIn', href: c.linkedin },
  { label: 'GitHub', href: c.github },
  { label: 'Book a 30 minute call', href: c.booking },
];

/** The two public profiles, for the `sameAs` list of the structured data. */
export const profileLinks = [c.linkedin, c.github];
